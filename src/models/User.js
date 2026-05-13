import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },

    provider_id: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      default: "user",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;