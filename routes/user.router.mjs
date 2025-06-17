import express from "express";
import { authenticate } from "../middleware/authenticate.mjs";
import avatarUpload from "../middleware/avatarUpload.mjs";
import {
  getUserById,
  updateProfilePicture,
} from "../controllers/user.controller.mjs";
import validate from "../middleware/validate.mjs";
import { param } from "express-validator";
import upload from "../middleware/cloudinary.mjs";

const router = express.Router();

// All routes in this file are for an authenticated user
// router.use(authenticate);

// PATCH /api/v1/users/me/avatar
// 1. Authenticate user
// 2. Use multer to handle a single file upload from a form field named 'avatar'
router.patch(
  "/me/avatar",
  authenticate,
  upload.single("avatar"),
  updateProfilePicture
);
router.get("/:id", [
  param("id").isMongoId().withMessage("Invalid User ID"),
  validate,
  getUserById,
]);
export default router;
