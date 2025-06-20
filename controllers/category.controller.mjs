import categoryService from "../services/category.service.mjs";
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json({
      status: "success",
      results: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};