import express from "express";
import { authenticate } from "../middleware/authenticate.mjs";
import avatarUpload from "../middleware/avatarUpload.mjs";
import {
  getUserById,
  updateProfilePicture,
} from "../controllers/user.controller.mjs";
import validate from "../middleware/validate.mjs";
import { param } from "express-validator";
import upload from "../middleware/multer.mjs";

const router = express.Router();
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
