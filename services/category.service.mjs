import Category from "../models/category.model.mjs";

class CategoryService {
  /**
   * Retrieves all categories from the database.
   */
  async getAllCategories() {
    // Find all categories and sort them alphabetically by name
    const categories = await Category.find().sort({ name: "asc" });
    return categories;
  }
}

export default new CategoryService();
