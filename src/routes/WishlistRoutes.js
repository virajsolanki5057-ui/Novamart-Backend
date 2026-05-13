import express from "express";
import { protect } from "../middleware/auth.js";
const router = express.Router();

import {
  toggleWishlist,
  getAllWishlist,
  deleteWishlist,
} from "../controllers/wishlistcontroller.js";

// All wishlist routes are protected by JWT
router.post("/wishlist", protect, toggleWishlist);
router.get("/wishlist", protect, getAllWishlist);
router.delete("/wishlist/:id", protect, deleteWishlist);

export default router;
