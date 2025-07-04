import UserNotFoundException from "../exceptions/UserNotFoundException.mjs";
import Product from "../models/product.model.mjs";
import User from "../models/user.model.mjs";
class UserService {
  async findUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }
  async getMyReviews(userId) {
    const productsWithUserReviews = await Product.find(
      { "reviews.user": userId },
      {
        "reviews.$": 1,
        name: 1,
        slug: 1,
        images: { $slice: 1 }, 
      }
    );
    const userReviews = productsWithUserReviews.map((p) => ({
      ...p.reviews[0].toObject(), 
      product: {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        image: p.images[0],
      },
    }));
    return userReviews;
  }
  async updateUser(userId, updateData) {
    const allowedUpdates = ["name", "shippingAddress"];
    const filteredUpdateData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });
    const user = await User.findByIdAndUpdate(userId, filteredUpdateData, {
      new: true, 
      runValidators: true, 
    }).select("-password"); 
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }
  async updateUserAvatar(userId, avatarPath) {
    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: avatarPath },
      { new: true, runValidators: true }
    );
    return user;
  }
  async getWishlist(userId) {
    const user = await User.findById(userId).populate("wishlist");
    if (!user) throw new GenericException(404, "User not found");
    return user.wishlist;
  }
  async toggleWishlistItem(userId, productId) {
    const [user, productExists] = await Promise.all([
      User.findById(userId),
      Product.findById(productId),
    ]);
    if (!user) {
      throw new GenericException(404, "User not found.");
    }
    if (!productExists) {
      throw new GenericException(404, "Product not found.");
    }
    const wishlistAsStrings = user.wishlist.map((id) => id.toString());
    const index = wishlistAsStrings.indexOf(productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }
    await user.save();
    return user;
  }
  async getCart(userId) {
    const user = await User.findById(userId).populate("cart.product");
    if (!user) throw new GenericException(404, "User not found");
    return user.cart;
  }
  async addItemToCart(userId, productId, quantity) {
    const user = await User.findById(userId);
    const product = await Product.findById(productId);
    if (!product) throw new GenericException(404, "Product not found");
    if (product.stockCount < quantity)
      throw new GenericException(400, "Not enough stock");
    const itemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );
    if (itemIndex > -1) {
      user.cart[itemIndex].quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }
    await user.save();
    return this.getCart(userId); 
  }
  async updateCartItemQuantity(userId, productId, newQuantity) {
    if (newQuantity <= 0) {
      return this.removeItemFromCart(userId, productId);
    }
    const user = await User.findById(userId);
    const productStock = await Product.findById(productId);
    if (productStock.stockCount - newQuantity < 0) {
      throw new GenericException(400, "Not enough stock");
    }
    const itemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );
    if (itemIndex > -1) {
      user.cart[itemIndex].quantity = newQuantity;
      await user.save();
    }
    return this.getCart(userId);
  }
  async removeItemFromCart(userId, productId) {
    const user = await User.findById(userId);
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );
    await user.save();
    return this.getCart(userId);
  }
  async clearCart(userId) {
    const user = await User.findById(userId);
    user.cart = [];
    await user.save();
    return user.cart;
  }
}
export default new UserService();