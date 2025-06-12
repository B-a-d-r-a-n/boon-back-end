// src/routes/comment.router.mjs
import express from "express";
import { body, param } from "express-validator";
import { authenticate } from "../middleware/authenticate.mjs";
import {
  deleteComment,
  postComment,
  postReply,
  updateCommentController,
} from "../controllers/comment.controller.mjs";
import validate from "../middleware/validate.mjs";

const router = express.Router();

// All comment/reply actions require a user to be logged in.
router.use(authenticate);

// --- Route for posting a reply to a specific comment ---
// We define this first as it's more specific than the other route.
//post new comment
router.post(
  "/:articleId/comments",
  //   authenticate,
  [
    param("articleId").isMongoId().withMessage("Invalid article ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  postComment
);
//post reply to comment
router.post(
  "/:commentId/replies",
  //   authenticate,
  [
    param("commentId").isMongoId().withMessage("Invalid comment ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  postReply
);
router.patch(
  "/:commentId",
  //   authenticate, // User must be logged in to edit
  [
    param("commentId").isMongoId().withMessage("Invalid comment ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  updateCommentController
);
//delete comment
router.delete(
  "/:id",
  //   authenticate,
  [param("id").isMongoId().withMessage("Invalid Comment ID")],
  validate,
  deleteComment
);

// Note: We don't have a top-level POST /comments route.
// Comments are always created in the context of an article.

// We will mount this router in app.mjs at /api/v1/comments

export default router;
