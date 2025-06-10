// models/book.model.mjs
import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    coverImage: { type: String, required: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// index for searching
bookSchema.index({ title: "text", author: "text" }); // { weights: { title: 10, author: 5 } });

const Book = mongoose.model("Book", bookSchema, "books");
export default Book;
