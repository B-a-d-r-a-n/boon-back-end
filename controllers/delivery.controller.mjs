import deliveryServices from "../services/delivery.services.mjs";
export const getAllDeliveryMethods = async (req, res, next) => {
  try {
    const methods = await deliveryServices.getAll();
    res.status(200).json({
      status: "success",
      results: methods.length,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
};