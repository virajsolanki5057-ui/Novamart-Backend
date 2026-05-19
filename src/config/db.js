import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    console.log("Connecting to MongoDB...");

    const connection = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB connection is not ready");
    }

    const host = connection?.connection?.host || mongoose.connection.host || "unknown-host";
    console.log(`MongoDB connected: ${host}`);

    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected");
    });

    mongoose.connection.on("error", (err) => {
      console.log("Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected");
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);

    if (error.name === "MongooseServerSelectionError") {
      console.log("Check MongoDB Atlas IP allowlist and MONGO_URI");
    }

    process.exit(1);
  }
};

export default connectDB;
