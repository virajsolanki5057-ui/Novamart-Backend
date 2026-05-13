import mongoose from "mongoose";

export const ORDER_STATUSES = ["Pending", "Confirmed", "Dispatched", "Delivered", "Cancelled"];
export const TERMINAL_ORDER_STATUSES = ["Delivered", "Cancelled"];

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pending",
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, "Please provide a valid 6-digit postal code"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
