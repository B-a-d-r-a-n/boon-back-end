import DeliveryMethod from "../models/deliveryMethod.model.mjs";
class DeliveryService {
  async getAll() {
    return await DeliveryMethod.find().sort({ price: "asc" });
  }
}
export default new DeliveryService();