import Products from "../models/product.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const isValidProductId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// ✅ GET ALL PRODUCTS (FIXED)
export const getProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, page = 1, limit } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (search) filter.name = { $regex: search, $options: "i" };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let query = Products.find(filter).sort({ createdAt: -1 });

    const total = await Products.countDocuments(filter);

    if (limit) {
      const skip = (Number(page) - 1) * Number(limit);
      query = query.skip(skip).limit(Number(limit));
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
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: err.message,
    });
  }
};

// ✅ GET BY ID
export const getProductById = async (req, res) => {
  try {
    if (!isValidProductId(req.params.id)) {
      return res.status(404).json({ success: false, msg: "Invalid Product ID" });
    }

    const product = await Products.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    res.status(200).json({
      success: true,
      data: product,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Server Error",
      error: err.message,
    });
  }
};

// ✅ CREATE PRODUCT (CLOUDINARY FIXED)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      stock,
      price,
      brand,
      shortDescription,
      description,
    } = req.body;

    if (
      !name ||
      !category ||
      !stock ||
      !price ||
      !brand ||
      !shortDescription ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    const image = req.file ? req.file.path : "";
    const imagePublicId = req.file ? req.file.filename : "";

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
      user: req.user?.id,
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      msg: "Product created successfully",
      data: newProduct,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error creating product",
      error: err.message,
    });
  }
};

// ✅ UPDATE PRODUCT (CLOUDINARY SAFE)
export const updateProduct = async (req, res) => {
  try {
    if (!isValidProductId(req.params.id)) {
      return res.status(404).json({ success: false, msg: "Invalid Product ID" });
    }

    const product = await Products.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    const updateData = { ...req.body };

    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.stock) updateData.stock = Number(updateData.stock);

    // Cloudinary image update
    if (req.file) {
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }

      updateData.image = req.file.path;
      updateData.imagePublicId = req.file.filename;
    }

    const updatedProduct = await Products.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      msg: "Product updated successfully",
      data: updatedProduct,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Update failed",
      error: err.message,
    });
  }
};

// ✅ DELETE PRODUCT (CLOUDINARY SAFE)
export const deleteProduct = async (req, res) => {
  try {
    if (!isValidProductId(req.params.id)) {
      return res.status(404).json({ success: false, msg: "Invalid Product ID" });
    }

    const product = await Products.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    await Products.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      msg: "Product deleted successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Delete failed",
      error: err.message,
    });
  }
};