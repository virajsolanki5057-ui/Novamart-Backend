import Wishlist from "../models/wishlist.js";
import Product from "../models/product.js";
import mongoose from "mongoose";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ✅ TOGGLE (ADD/REMOVE)
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid productId required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if item already exists in wishlist
    const existingItem = await Wishlist.findOne({ userId, productId });

    if (existingItem) {
      // If it exists, remove it (Toggle behavior)
      await Wishlist.findByIdAndDelete(existingItem._id);
      return res.status(200).json({
        success: true,
        message: "Removed from wishlist",
        action: "removed",
        productId
      });
    }

    // If it doesn't exist, add it
    const newItem = await Wishlist.create({ userId, productId });
    await newItem.populate("productId");

    res.status(201).json({
      success: true,
      message: "Added to wishlist",
      action: "added",
      data: newItem
    });
  } catch (error) {
    console.error("WISHLIST TOGGLE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ✅ GET ALL
export const getAllWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const items = await Wishlist.find({ userId })
      .populate("productId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ✅ DELETE (Direct removal by wishlist ID)
export const deleteWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid wishlist item ID required",
      });
    }

    const item = await Wishlist.findOneAndDelete({ _id: id, userId });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found or unauthorized",
      });
    }

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("DELETE WISHLIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
