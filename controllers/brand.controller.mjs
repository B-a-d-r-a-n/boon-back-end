import brandService from "../services/brand.service.mjs";
export const getAllBrands = async (req, res, next) => {
  try {
    const brands = await brandService.getAllBrands();
    res.status(200).json({
      status: "success",
      results: brands.length,
      data: brands,
    });
  } catch (error) {
    next(error);
  }
};