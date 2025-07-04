import Order from "../models/order.model.mjs";
import Product from "../models/product.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import User from "../models/user.model.mjs";
class OrderService {
  async createOrder(orderData, userId) {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = orderData;
    if (!orderItems || orderItems.length === 0) {
      throw new GenericException(400, "No order items");
    }
    const completeOrderItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new GenericException(
            404,
            `Product with ID ${item.product} not found.`
          );
        }
        if (product.stockCount < item.quantity) {
          throw new GenericException(
            400,
            `Not enough stock for ${product.name}`
          );
        }
        return {
          name: product.name,
          image: product.images[0],
          price: product.price,
          quantity: item.quantity,
          product: item.product,
        };
      })
    );
    const order = new Order({
      user: userId,
      orderItems: completeOrderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });
    const createdOrder = await order.save();
    for (const item of createdOrder.orderItems) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stockCount: -item.quantity } }
      );
    }
    await User.findByIdAndUpdate(userId, {
      $set: { cart: [] }, 
    });
    return createdOrder;
  }
  async updateOrderToDelivered(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new GenericException(404, "Order not found");
    }
    if (!order.isPaid) {
      throw new GenericException(400, "Cannot deliver an unpaid order.");
    }
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updatedOrder = await order.save();
    return updatedOrder;
  }
  async getMyOrders(userId) {
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    if (!orders) {
      return [];
    }
    return orders;
  }
  async getOrderById(orderId) {
    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order) {
      throw new GenericException(404, "Order not found");
    }
    return order;
  }
  async getMyOrders(userId) {
    const orders = await Order.find({ user: userId });
    return orders;
  }
}
export default new OrderService();