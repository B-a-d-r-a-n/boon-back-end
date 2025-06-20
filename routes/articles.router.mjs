import express from "express";
import { body, param, validationResult } from "express-validator";
import GenericException from "../exceptions/GenericException.mjs";
import starRouter from "./star.router.mjs";
import {
  getAllArticles,
  getArticleById,
  addArticle,
  updateArticle,
  deleteArticle,
} from "../controllers/article.controller.mjs";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.mjs"; 
import { authorize } from "../middleware/authorize.mjs"; 
import coverImageUpload from "../middleware/coverImageUpload.mjs";
import {
  deleteComment,
  getCommentsByArticle,
  postComment,
  postReply,
} from "../controllers/comment.controller.mjs";
import upload from "../middleware/cloudinary.mjs";
const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    throw new GenericException(400, errorMessages);
  }
  next();
};
router.get("/", getAllArticles);
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid Article ID")],
  validate,
  getArticleById
);
router.get(
  "/:articleId/comments",
  [param("articleId").isMongoId().withMessage("Invalid article ID.")],
  validate,
  getCommentsByArticle
);
router.post(
  "/:articleId/comments",
  authenticate, 
  [
    param("articleId").isMongoId().withMessage("Invalid article ID."),
    body("text").notEmpty().withMessage("Comment text cannot be empty."),
  ],
  validate,
  postComment
);
router.post(
  "/",
  authenticate, 
  upload.single("coverImage"),
  [
    body("title").notEmpty().withMessage("Title is required").trim(),
    body("summary").notEmpty().withMessage("Summary is required").trim(),
    body("content").notEmpty().withMessage("Content is required"),
    body("category").isMongoId().withMessage("A valid category ID is required"),
    body("tags").optional(),
  ],
  validate,
  addArticle
);
router.patch(
  "/:id",
  authenticate, 
  upload.single("coverImage"),
  [
    param("id").isMongoId().withMessage("Invalid Article ID"),
    body("title").optional().notEmpty().trim(),
    body("summary").optional().notEmpty().trim(),
  ],
  validate,
  updateArticle 
);
router.delete(
  "/:id",
  authenticate,
  [param("id").isMongoId().withMessage("Invalid Article ID")],
  validate,
  deleteArticle
);
router.use("/", starRouter);
export default router;