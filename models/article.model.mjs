import mongoose from "mongoose";
const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String, required: false },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    readTimeInMinutes: { type: Number, required: true, default: 1 },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    totalCommentCount: {
      type: Number,
      default: 0,
    },
    starsCount: {
      type: Number,
      default: 0,
    },
    starredBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
articleSchema.index(
  { title: "text", summary: "text" },
  { weights: { title: 10, summary: 5 } }
);
const Article = mongoose.model("Article", articleSchema, "articles");
export default Article;