import express from "express";
import { body, param } from "express-validator";
import { authenticate } from "../middleware/authenticate.mjs";
import {
  deleteComment,
  postReply,
  updateCommentController,
} from "../controllers/comment.controller.mjs";
import validate from "../middleware/validate.mjs";
const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Managing comments and replies
 */

/**
 * @swagger
 * /comments/{commentId}/replies:
 *   post:
 *     summary: Post a reply to a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *     responses:
 *       201:
 *         description: Reply created successfully.
 */
router.post(
  "/:commentId/replies",
  [
    param("commentId").isMongoId().withMessage("Invalid comment ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  postReply
);

/**
 * @swagger
 * /comments/{commentId}:
 *   patch:
 *     summary: Update a comment or reply
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *     responses:
 *       200:
 *         description: Comment updated successfully.
 */
router.patch(
  "/:commentId",
  [
    param("commentId").isMongoId().withMessage("Invalid comment ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  updateCommentController
);

/**
 * @swagger
 * /comments/{commentId}:
 *   delete:
 *     summary: Delete a comment or reply (and all its children)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Comment deleted successfully.
 */
router.delete(
  "/:commentId",
  [param("commentId").isMongoId().withMessage("Invalid Comment ID")],
  validate,
  deleteComment
);
export default router;
