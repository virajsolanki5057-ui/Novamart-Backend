import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  getMyOrders,
  getMyOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/orders", protect, createOrder);
router.get("/orders/my-orders/:id", protect, getMyOrderById);
router.get("/orders/my-orders", protect, getMyOrders);
router.get("/orders/:id", getOrderById);
router.get("/orders", getOrders);
router.put("/orders/status/:id", updateOrderStatus);
router.put("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id", deleteOrder);

export default router;
