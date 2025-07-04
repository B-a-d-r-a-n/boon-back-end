import UserService from "../services/user.service.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import userService from "../services/user.service.mjs";
import FormData from "form-data";
import axios from "axios";
export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userService.findUserById(userId);
    res.status(200).json({ status: "success", data: { user } });
  } catch (error) {
    next(error);
  }
};
export const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUser(req.user._id, req.body);
    res.status(200).json({ status: "success", data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
};
export const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await userService.getWishlist(req.user._id);
    res.status(200).json({ status: "success", data: wishlist });
  } catch (error) {
    next(error);
  }
};
export const toggleWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      throw new GenericException(400, "Product ID is required.");
    }
    const userId = req.user._id;
    const updatedUser = await userService.toggleWishlistItem(userId, productId);
    res.status(200).json({
      status: "success",
      message: "Wishlist updated.",
      data: {
        wishlist: updatedUser.wishlist,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const getCart = async (req, res, next) => {
  try {
    const cart = await userService.getCart(req.user._id);
    res.status(200).json({ status: "success", data: cart });
  } catch (error) {
    next(error);
  }
};
export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    if (quantity === undefined) {
      throw new GenericException(400, "Quantity is required.");
    }
    const updatedCart = await userService.updateCartItemQuantity(
      req.user._id,
      productId,
      quantity
    );
    res.status(200).json({ status: "success", data: updatedCart });
  } catch (error) {
    next(error);
  }
};
export const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      throw new GenericException(400, "Product ID and quantity are required.");
    }
    const updatedCart = await userService.addItemToCart(
      req.user._id,
      productId,
      quantity
    );
    res.status(200).json({ status: "success", data: updatedCart });
  } catch (error) {
    next(error);
  }
};
export const removeItemFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      throw new GenericException(
        400,
        "Product ID is required in the URL parameters."
      );
    }
    const updatedCart = await userService.removeItemFromCart(
      req.user._id,
      productId
    );
    res.status(200).json({ status: "success", data: updatedCart });
  } catch (error) {
    next(error);
  }
};
export const clearCart = async (req, res, next) => {
  try {
    const clearedCart = await userService.clearCart(req.user._id);
    res
      .status(200)
      .json({ status: "success", message: "Cart cleared.", data: clearedCart });
  } catch (error) {
    next(error);
  }
};
export const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await userService.getMyReviews(req.user._id);
    res.status(200).json({ status: "success", data: reviews });
  } catch (error) {
    next(error);
  }
};
export const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new GenericException(400, "Please upload a file.");
    }
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: req.file.originalname,
    });
    const imgbbResponse = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      { headers: formData.getHeaders() }
    );
    let newAvatarUrl;
    if (imgbbResponse.data && imgbbResponse.data.success) {
      newAvatarUrl = imgbbResponse.data.data.thumb.url;
    } else {
      console.error("ImgBB upload failed:", imgbbResponse.data);
      throw new GenericException(500, "Failed to upload avatar to image host.");
    }
    const updatedUser = await UserService.updateUserAvatar(
      req.user._id,
      newAvatarUrl
    );
    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
