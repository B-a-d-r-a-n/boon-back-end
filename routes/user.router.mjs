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
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profiles and actions
 */

/**
 * @swagger
 * /users/me/avatar:
 *   patch:
 *     summary: Update the current user's profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: The image file for the new avatar.
 *     responses:
 *       200:
 *         description: Avatar updated successfully. Returns the updated user object.
 *       400:
 *         description: No file was uploaded.
 */
router.patch(
  "/me/avatar",
  authenticate,
  upload.single("avatar"),
  updateProfilePicture
);
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user's public profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the user to retrieve.
 *     responses:
 *       200:
 *         description: The user's public profile data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found.
 */
router.get("/:id", [
  param("id").isMongoId().withMessage("Invalid User ID"),
  validate,
  getUserById,
]);
export default router;
