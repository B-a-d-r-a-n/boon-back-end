import Commercial from "../models/commercial.model.mjs";
class CommercialService {
  async getAll() {
    return await Commercial.find();
  }
}
export default new CommercialService();