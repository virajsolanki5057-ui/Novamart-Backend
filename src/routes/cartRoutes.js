import express from "express";
import { protect } from "../middleware/auth.js";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cartController.js";

const router = express.Router();

router.get("/cart", protect, getCart);
router.post("/cart/items", protect, addCartItem);
router.put("/cart/items/:productId", protect, updateCartItem);
router.delete("/cart/items/:productId", protect, removeCartItem);
router.delete("/cart", protect, clearCart);

export default router;
