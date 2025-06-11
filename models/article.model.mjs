// models/article.model.mjs
import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true }, // For the list view
    content: { type: String, required: true }, // The full HTML content
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
    readTimeInMinutes: {
      type: Number,
      required: true,
      default: 1, // A safe default
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    // We only store references to the top-level comments.
    // Replies are handled within the Comment model itself.
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
    // Important for virtuals to be included in JSON responses
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create a text index for powerful searching capabilities.
// We give 'title' a higher weight, so matches in the title are more relevant.
articleSchema.index(
  { title: "text", summary: "text" },
  { weights: { title: 10, summary: 5 } }
);

// VIRTUAL PROPERTY: Create a `commentCount` that is calculated on the fly.
// This is more efficient than storing and updating a count field in the DB.
articleSchema.virtual("commentCount").get(function () {
  // `this.comments` refers to the comments array in the document.
  return this.comments.length;
});

const Article = mongoose.model("Article", articleSchema, "articles");
export default Article;
