import express from "express";
import { authenticate } from "../middleware/authenticate.mjs";
import {
  getMyComments,
  getMyStarredArticles,
  getUserById,
  updateProfilePicture,
  updateUser,
} from "../controllers/user.controller.mjs";
import validate from "../middleware/validate.mjs";
import { param } from "express-validator";
import upload from "../middleware/multer.mjs";
const router = express.Router();
/** * @swagger * tags: *   name: Users *   description: User profiles and actions */ /** * @swagger * /users/me/avatar: *   patch: *     summary: Update the current user's profile picture *     tags: [Users] *     security: *       - bearerAuth: [] *     requestBody: *       required: true *       content: *         multipart/form-data: *           schema: *             type: object *             properties: *               avatar: *                 type: string *                 format: binary *                 description: The image file for the new avatar. *     responses: *       200: *         description: Avatar updated successfully. Returns the updated user object. *       400: *         description: No file was uploaded. */
router.patch(
  "/me/avatar",
  authenticate,
  upload.single("avatar"),
  updateProfilePicture
);
/** * @swagger * /users/me: *   patch: *     summary: Update the current user's data *     tags: [Users] *     security: *       - bearerAuth: [] *     requestBody: *       required: true *       content: *         application/json: *           schema: *             type: object *             properties: *               name: *                 type: string *               email: *                 type: string *               address: *                 type: string *     responses: *       200: *         description: User data updated successfully. Returns the updated user object. *       400: *         description: Invalid data provided. */
router.patch("/me", authenticate, updateUser);
/** * @swagger * /users/me/comments: *   get: *     summary: Get all comments made by the current user *     tags: [Users] *     security: *       - bearerAuth: [] *     responses: *       200: *         description: A list of comments. *         content: *           application/json: *             schema: *               type: array *               items: *                 $ref: '#/components/schemas/Comment' */
router.get("/me/comments", authenticate, getMyComments);
/** * @swagger * /users/me/starred: *   get: *     summary: Get all articles starred by the current user *     tags: [Users] *     security: *       - bearerAuth: [] *     responses: *       200: *         description: A list of starred articles. *         content: *           application/json: *             schema: *               type: array *               items: *                 $ref: '#/components/schemas/Article' */
router.get("/me/starred-articles", authenticate, getMyStarredArticles);
/** * @swagger * /users/{id}: *   get: *     summary: Get a user's public profile by ID *     tags: [Users] *     parameters: *       - in: path *         name: id *         required: true *         schema: { type: string } *         description: The ID of the user to retrieve. *     responses: *       200: *         description: The user's public profile data. *         content: *           application/json: *             schema: *               $ref: '#/components/schemas/User' *       404: *         description: User not found. */
router.get("/:id", [
  param("id").isMongoId().withMessage("Invalid User ID"),
  validate,
  getUserById,
]);
export default router;
