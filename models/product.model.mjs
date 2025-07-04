import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema(
  {
    rating: { type: Number, default: 0, required: true },
    comment: { type: String, default: "", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);
const productSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    images: [{ type: String, default: [""], required: true }],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    description: { type: String, default: "", required: true },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0, required: true, default: 0 },
    numReviews: { type: Number, default: 0, required: true, default: 0 },
    isFeatured: { type: Boolean, index: true, default: false },
    price: { type: Number, default: 0, required: true, default: 0 },
    stockCount: { type: Number, default: 0, required: true, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
productSchema.index({ name: "text", description: "text", brand: "text" });
const Product = mongoose.model("Product", productSchema, "products");
export default Product;