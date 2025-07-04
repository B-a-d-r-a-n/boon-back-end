import mongoose from "mongoose";
const commercialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    link: { type: String, default: "/products" },
  },
  { timestamps: true }
);
const Commercial = mongoose.model("Commercial", commercialSchema);
export default Commercial;