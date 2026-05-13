import Order, { ORDER_STATUSES, TERMINAL_ORDER_STATUSES } from "../models/order.js";
import Product from "../models/product.js";

const generateOrderId = () => {
  return `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Date.now()}`;
};

const ORDER_STATUS_TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Dispatched", "Cancelled"],
  Dispatched: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

const ORDER_STATUS_ALIASES = {
  pending: "Pending",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  Pending: "Pending",
  Confirmed: "Confirmed",
  Dispatched: "Dispatched",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
  shipped: "Dispatched",
};

const normalizeStatus = (status) => {
  if (!status || typeof status !== "string") return null;
  const statusKey = status.trim().toLowerCase();
  return ORDER_STATUS_ALIASES[statusKey] || null;
};

const serializeOrder = (orderDoc) => {
  const order = orderDoc?.toObject ? orderDoc.toObject() : orderDoc;
  if (!order) return order;

  const normalizedStatus = normalizeStatus(order.status) || "Pending";
  return {
    ...order,
    status: normalizedStatus,
    statusKey: normalizedStatus.toLowerCase(),
  };
};

export const createOrder = async (req, res) => {
  try {
    const { customerName, items, phoneNumber, address, postalCode } = req.body;
    const userId = req.user.id;

    if (!customerName || !items || items.length === 0 || !phoneNumber || !address || !postalCode) {
      return res.status(400).json({ success: false, msg: "Please provide all required fields" });
    }

    if (!/^\d{6}$/.test(postalCode)) {
      return res.status(400).json({ success: false, msg: "Postal code must be exactly 6 digits" });
    }

    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, msg: `Product not found: ${item.name}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, msg: `Insufficient stock for product: ${product.name}` });
      }
      totalAmount += product.price * item.quantity;
      item.price = product.price;
      item.name = product.name;
    }

    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = await Order.create({
      user: userId,
      orderId: generateOrderId(),
      customerName,
      items,
      totalAmount,
      phoneNumber,
      address,
      postalCode,
    });

    res.status(201).json({ success: true, data: serializeOrder(order) });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error creating order", error: err.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders.map(serializeOrder),
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error fetching orders", error: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders.map(serializeOrder),
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error fetching your orders", error: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { orderId: req.params.id }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    res.status(200).json({ success: true, data: serializeOrder(order) });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error fetching order", error: err.message });
  }
};

export const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      user: req.user.id,
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { orderId: req.params.id }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    res.status(200).json({ success: true, data: serializeOrder(order) });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error fetching order", error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const normalizedStatus = normalizeStatus(req.body.status);

    if (!normalizedStatus) {
      return res.status(400).json({
        success: false,
        msg: `Invalid status value. Allowed statuses: ${ORDER_STATUSES.join(", ")}`,
      });
    }

    const order = await Order.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { orderId: req.params.id }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    const currentStatus = normalizeStatus(order.status);
    
    if (currentStatus === normalizedStatus) {
      return res.status(200).json({ success: true, data: serializeOrder(order) });
    }

    if (!currentStatus) {
      return res.status(400).json({
        success: false,
        msg: `Order has unsupported current status: ${order.status}`,
      });
    }

    if (TERMINAL_ORDER_STATUSES.includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        msg: `Order status is locked because it is already ${currentStatus}`,
      });
    }

    const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedNextStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        msg: `Invalid status transition from ${currentStatus} to ${normalizedStatus}. Allowed next statuses: ${allowedNextStatuses.join(", ")}`,
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      {
        status: normalizedStatus,
        statusUpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: serializeOrder(updatedOrder) });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error updating order status", error: err.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { orderId: req.params.id }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error deleting order", error: err.message });
  }
};
