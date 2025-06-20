import mongoose from "mongoose";
const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
});
const Tag = mongoose.model("Tag", tagSchema, "tags");
export default Tag;