import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },

    // --- THIS IS THE CHANGE ---
    // We now store the full URL from Cloudinary directly.
    coverImageUrl: { type: String, required: false },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    readTimeInMinutes: { type: Number, required: true, default: 1 },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// The text index remains the same and is good.
articleSchema.index(
  { title: "text", summary: "text" },
  { weights: { title: 10, summary: 5 } }
);

// The commentCount virtual property also remains the same.
articleSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

const Article = mongoose.model("Article", articleSchema, "articles");
export default Article;
