import express from "express";
import { authenticate } from "../middleware/authenticate.mjs";
import {
  addItemToCart,
  clearCart,
  getCart,
  getMyReviews,
  getUserById,
  getWishlist,
  removeItemFromCart,
  toggleWishlistItem,
  updateCartItemQuantity,
  updateProfilePicture,
  updateUser,
} from "../controllers/user.controller.mjs";
import validate from "../middleware/validate.mjs";
import { body, param } from "express-validator";
import upload from "../middleware/multer.mjs";
const router = express.Router();
router.patch(
  "/me/avatar",
  authenticate,
  upload.single("avatar"),
  updateProfilePicture
);
router.patch("/me", authenticate, updateUser);
router.get("/:id", [
  param("id").isMongoId().withMessage("Invalid User ID"),
  validate,
  getUserById,
]);
router.get("/me/reviews", authenticate, getMyReviews);
router
  .route("/wishlist")
  .get(authenticate, getWishlist)
  .post(authenticate, toggleWishlistItem); 
router
  .route("/cart")
  .get(getCart)
  .post(authenticate, addItemToCart) 
  .delete(authenticate, clearCart); 
router
  .route("/cart/:productId")
  .patch(
    authenticate, 
    [
      param("productId").isMongoId().withMessage("Invalid Product ID"),
      body("quantity")
        .isInt({ min: 1 })
        .withMessage("Quantity must be a positive integer."),
    ],
    validate,
    updateCartItemQuantity
  )
  .delete(authenticate, removeItemFromCart); 
export default router;