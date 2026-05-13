import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    guestId: {
      type: String,
      required: false,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true, sparse: true });
wishlistSchema.index({ guestId: 1, productId: 1 }, { unique: true, sparse: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;