import Cart from "../models/cart.js";
import Product from "../models/product.js";

const getUserCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    await cart.populate("items.product");
  }

  return cart;
};

export const getCart = async (req, res) => {
  try {
    const cart = await getUserCart(req.user.id);
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error fetching cart", error: err.message });
  }
};

export const addCartItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const numericQuantity = Number(quantity);

    if (!productId || !Number.isInteger(numericQuantity) || numericQuantity < 1) {
      return res.status(400).json({ success: false, msg: "Valid productId and quantity are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    if (product.stock < numericQuantity) {
      return res.status(400).json({ success: false, msg: "Not enough stock available" });
    }

    // Stock is NOT decremented here — it is only reduced when the order is placed
    // (see orderController.js createOrder) to prevent double-decrement bugs.

    const cart = await getUserCart(req.user.id);
    const existingItem = cart.items.find((item) => item.product._id.toString() === productId);

    if (existingItem) {
      existingItem.quantity += numericQuantity;
    } else {
      cart.items.push({ product: product._id, quantity: numericQuantity });
    }

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ success: true, msg: "Cart updated", data: cart });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error updating cart", error: err.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const numericQuantity = Number(quantity);

    if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
      return res.status(400).json({ success: false, msg: "Valid quantity is required" });
    }

    const cart = await getUserCart(req.user.id);
    const item = cart.items.find((cartItem) => cartItem.product._id.toString() === req.params.productId);

    if (!item) {
      return res.status(404).json({ success: false, msg: "Cart item not found" });
    }

    item.quantity = numericQuantity;
    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ success: true, msg: "Cart item updated", data: cart });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error updating cart item", error: err.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const cart = await getUserCart(req.user.id);
    cart.items = cart.items.filter((item) => item.product._id.toString() !== req.params.productId);
    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ success: true, msg: "Cart item removed", data: cart });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error removing cart item", error: err.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await getUserCart(req.user.id);
    cart.items = [];
    await cart.save();

    res.status(200).json({ success: true, msg: "Cart cleared", data: cart });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error clearing cart", error: err.message });
  }
};
