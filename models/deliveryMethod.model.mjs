import mongoose from "mongoose";
const deliveryMethodSchema = new mongoose.Schema({
  shortName: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  deliveryTime: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
});
const DeliveryMethod = mongoose.model("DeliveryMethod", deliveryMethodSchema);
export default DeliveryMethod;