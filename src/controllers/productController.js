import Products from '../models/product.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

const getOwnedProductQuery = (req, productId) => {
  if (req.user?.role === "admin") {
    return { _id: productId };
  }
  return {
    _id: productId,
    user: req.user?.id,
  };
};

const getVisibleProductQuery = (req, productId) => {
  const visibleToUser = [
    { user: { $exists: false } },
    { user: null },
  ];

  if (req.user?.id) {
    visibleToUser.push({ user: req.user.id });
  }

  if (!productId) {
    return { $or: visibleToUser };
  }

  return {
    _id: productId,
    $or: visibleToUser,
  };
};

const isValidProductId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, page = 1, limit } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (search) filter.name = { $regex: search, $options: 'i' };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const query = Products.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    const total = await Products.countDocuments(filter);

    if (limit) {
      const skip = (Number(page) - 1) * Number(limit);
      query.skip(skip).limit(Number(limit));
    }

    const products = await query;

    res.status(200).json({
      success: true,
      total,
      page: limit ? Number(page) : 1,
      pages: limit ? Math.ceil(total / Number(limit)) : 1,
      data: products,
    });

  } catch (err) {
    res.status(500).json({ success: false, msg: "Server Error", error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    if (!isValidProductId(req.params.id)) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    const product = await Products.findById(req.params.id)
      .populate("user", "name email role");

    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });

  } catch (err) {
    res.status(500).json({ success: false, msg: "Server Error", error: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    const { name, category, stock, price, brand, shortDescription, description } = req.body;

    if ([name, category, stock, price, brand, shortDescription, description].some((field) => field === undefined || field === "")) {
      return res.status(400).json({ success: false, msg: "All fields are required" });
    }

    const image = req.file ? req.file.path : '';
    const imagePublicId = req.file ? req.file.filename : '';

    const newProduct = new Products({
      name,
      category,
      stock: Number(stock),
      price: Number(price),
      brand,
      shortDescription,
      description,
      image,
      imagePublicId,
      user: req.user.id,
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      msg: "Product created successfully",
      data: newProduct
    });

  } catch (err) {
    res.status(500).json({ success: false, msg: "Error adding product", error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    if (!isValidProductId(req.params.id)) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    const product = await Products.findOne(getOwnedProductQuery(req, req.params.id));

    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    const updateData = { ...req.body };
    delete updateData.user;
    delete updateData.role;

    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.stock) updateData.stock = Number(updateData.stock);

    if (req.file) {
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }
      updateData.image = req.file.path;
      updateData.imagePublicId = req.file.filename;
    }

    const updatedProduct = await Products.findOneAndUpdate(
      getOwnedProductQuery(req, req.params.id),
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      msg: "Product updated successfully",
      data: updatedProduct
    });

  } catch (err) {
    res.status(500).json({ success: false, msg: "Update failed", error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    if (!isValidProductId(req.params.id)) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    const product = await Products.findOne(getOwnedProductQuery(req, req.params.id));

    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    await Products.findOneAndDelete(getOwnedProductQuery(req, req.params.id));

    res.status(200).json({
      success: true,
      msg: "Product deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ success: false, msg: "Delete failed", error: err.message });
  }
};