import express from 'express';
import upload from '../config/cloudinary.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const uploadProductImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) {
      return next();
    }

    const isCloudinaryAuthError =
      err.message?.includes('Invalid Signature') ||
      err.message?.includes('Invalid api_key') ||
      err.message?.includes('Must supply api_key');

    return res.status(500).json({
      success: false,
      message: isCloudinaryAuthError
        ? 'Cloudinary credentials are invalid. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.'
        : err.message || 'Image upload failed',
    });
  });
};

router.get('/products', optionalAuth, getProducts);
router.get('/product/:id', optionalAuth, getProductById);

router.post('/product', protect, uploadProductImage, createProduct);
router.put('/product/:id', protect, uploadProductImage, updateProduct);
router.delete('/product/:id', protect, deleteProduct);

export default router;
