import orderService from "../services/order.service.mjs";
export const addOrderItems = async (req, res, next) => {
  try {
    const newOrder = await orderService.createOrder(req.body, req.user._id);
    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};
export const updateOrderToDelivered = async (req, res, next) => {
  try {
    const updatedOrder = await orderService.updateOrderToDelivered(
      req.params.id
    );
    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
};
export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getMyOrders(req.user._id);
    res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};