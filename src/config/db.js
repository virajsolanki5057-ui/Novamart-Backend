import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    // Check URI
    if (!uri) {
      throw new Error(
        "❌ MONGO_URI is missing in environment variables"
      );
    }

    console.log("🔄 Connecting to MongoDB...");

    // MongoDB Connection
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection Events
    mongoose.connection.on("connected", () => {
      console.log("🟢 Mongoose connected");
    });

    mongoose.connection.on("error", (err) => {
      console.log("🔴 Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🟠 Mongoose disconnected");
    });

  } catch (error) {
    console.error("❌ MongoDB Connection Failed:");
    console.error(error.message);

    if (error.name === "MongooseServerSelectionError") {
      console.log(
        "⚠️ Check MongoDB Atlas IP Access and MONGO_URI"
      );
    }

    process.exit(1);
  }
};

export default connectDB;