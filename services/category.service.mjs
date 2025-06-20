import Category from "../models/category.model.mjs";
class CategoryService {
  async getAllCategories() {
    const categories = await Category.find().sort({ name: "asc" });
    return categories;
  }
}
export default new CategoryService();