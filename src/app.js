import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";
import "./config/passport.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/AdminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import wishlistRoutes from "./routes/WishlistRoutes.js";

const app = express();

const parseOriginList = (value) =>
  String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://my-novamart-website.vercel.app",
  ...parseOriginList(process.env.FRONTEND_URL),
  ...parseOriginList(process.env.CORS_ORIGINS),
]);

const allowVercelPreviewOrigins =
  String(process.env.ALLOW_VERCEL_PREVIEW_ORIGINS || "false").toLowerCase() === "true";

const isVercelPreviewOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) =>
  allowedOrigins.has(origin) || (allowVercelPreviewOrigins && isVercelPreviewOrigin(origin));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-guest-id",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", orderRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", contactRoutes);
app.use("/api", wishlistRoutes);

app.get("/", (req, res) => {
  res.send("NovaMart API is running.");
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Critical error:", err);
  const statusCode = err?.message?.startsWith("CORS blocked for origin:")
    ? 403
    : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
