import express from "express";
import { body, param } from "express-validator";
import { authenticate } from "../middleware/authenticate.mjs";
import { authorize } from "../middleware/authorize.mjs";
import upload from "../middleware/multer.mjs";
import validate from "../middleware/validate.mjs";
import {
  getAllProducts,
  addProduct,
  updateProduct,
  createProductReview,
  getProductBySlug,
} from "../controllers/product.controller.mjs";
import {
  removeItemFromCart,
  updateCartItemQuantity,
} from "../controllers/user.controller.mjs";
const router = express.Router();
router.get("/", getAllProducts);
router.post(
  "/:id/reviews",
  authenticate,
  [
    param("id").isMongoId().withMessage("Invalid Product ID."),
    body("rating").isNumeric().withMessage("Rating must be a number."),
    body("comment").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  createProductReview
);
router.get(
  "/:slug", 
  validate,
  getProductBySlug 
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin"), 
  upload.single("image"),
  [
    param("id").isMongoId().withMessage("Invalid Product ID"),
    body("name").optional().notEmpty().trim(),
  ],
  validate,
  updateProduct
);
router.post(
  "/",
  authenticate,
  authorize("admin"), 
  upload.single("image"), 
  [
    body("name").notEmpty().withMessage("Product name is required").trim(),
    body("brand").notEmpty().withMessage("Brand is required").trim(),
    body("description").notEmpty().withMessage("Description is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("stockCount").isNumeric().withMessage("Stock count must be a number"),
    body("category").isMongoId().withMessage("A valid category ID is required"),
  ],
  validate,
  addProduct
);
router
  .route("/cart/:productId")
  .patch(
    [
      param("productId").isMongoId().withMessage("Invalid Product ID"),
      body("quantity")
        .notEmpty()
        .isInt({ min: 0 })
        .withMessage("Quantity must be a non-negative integer."),
    ],
    validate,
    updateCartItemQuantity
  )
  .delete(
    [param("productId").isMongoId().withMessage("Invalid Product ID")],
    validate,
    removeItemFromCart
  );
export default router;