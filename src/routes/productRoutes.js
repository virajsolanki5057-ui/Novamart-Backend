import express from "express";
import upload from "../config/cloudinary.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Cloudinary upload wrapper (FIXED)
const uploadProductImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();

    console.error("Upload Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Image upload failed",
    });
  });
};

// PUBLIC
router.get("/products", optionalAuth, getProducts);
router.get("/product/:id", optionalAuth, getProductById);

// PROTECTED
router.post("/product", protect, uploadProductImage, createProduct);
router.put("/product/:id", protect, uploadProductImage, updateProduct);
router.delete("/product/:id", protect, deleteProduct);

export default router;