// models/category.model.mjs
import mongoose from "mongoose";
//todo: add timestamps

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
});

const Category = mongoose.model("Category", categorySchema, "categories");
export default Category;
