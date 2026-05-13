import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/AdminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import wishlistRoutes from "./routes/WishlistRoutes.js";

const app = express();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ DB Error:", err));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow all origins dynamically to support credentials
      callback(null, origin || "*");
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);    
app.use("/api/users", userRoutes);   
app.use("/api/admin", adminRoutes); 
app.use("/api", orderRoutes);
app.use("/api", productRoutes);      
app.use("/api", cartRoutes);         
app.use("/api", contactRoutes);
app.use("/api", wishlistRoutes);

app.get("/", (req, res) => {
  res.send("🚀 NovaMart API is Running...");
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Critical Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;