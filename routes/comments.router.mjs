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
router.use(authenticate);
router.post(
  "/:commentId/replies",
  [
    param("commentId").isMongoId().withMessage("Invalid comment ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  postReply
);
router.patch(
  "/:commentId",
  [
    param("commentId").isMongoId().withMessage("Invalid comment ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  updateCommentController
);
router.delete(
  "/:commentId",
  [param("commentId").isMongoId().withMessage("Invalid Comment ID")],
  validate,
  deleteComment
);
export default router;