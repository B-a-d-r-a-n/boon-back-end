import Brand from "../models/brand.model.mjs";
class BrandService {
  async getAllBrands() {
    const brands = await Brand.find().sort({ name: "asc" });
    return brands;
  }
}
export default new BrandService();