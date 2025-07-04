import commercialService from "../services/commercial.service.mjs";
export const getAllCommercials = async (req, res, next) => {
  try {
    const commercials = await commercialService.getAll();
    res.status(200).json({ status: "success", data: commercials });
  } catch (error) {
    next(error);
  }
};