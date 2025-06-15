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

// POST /api/v1/comments/:commentId/replies
router.post(
  "/:commentId/replies",
  [
    param("commentId").isMongoId().withMessage("Invalid comment ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  postReply
);

// PATCH /api/v1/comments/:commentId
router.patch(
  "/:commentId",
  [
    param("commentId").isMongoId().withMessage("Invalid comment ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  updateCommentController
);

// DELETE /api/v1/comments/:commentId
// Note: your original route used `:id`, let's make it consistent with `:commentId`
router.delete(
  "/:commentId",
  [param("commentId").isMongoId().withMessage("Invalid Comment ID")],
  validate,
  deleteComment
);
// We will mount this router in app.mjs at /api/v1/comments

export default router;
