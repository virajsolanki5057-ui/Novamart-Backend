import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message || error);
    if (error.name === "MongooseServerSelectionError") {
      console.error("Check Atlas IP access list, network/firewall settings, and the MongoDB connection string.");
    }
    process.exit(1);
  }
};

export default connectDB;