// routes/Articles.router.mjs
import express from "express";
import { body, param, validationResult } from "express-validator";
import GenericException from "../exceptions/GenericException.mjs";
// import apicache from "apicache"; // Caching might need re-evaluation with user-specific data
import upload from "../middleware/multerConfig.mjs";
import {
  getAllArticles,
  getArticleById,
  addArticle,
  updateArticle,
  deleteArticle,
} from "../controllers/article.controller.mjs";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.mjs"; // Import authenticate
import { authorize } from "../middleware/authorize.mjs"; // Import authorize

const router = express.Router();
// const cache = apicache.middleware; // Be careful caching authenticated user-specific routes

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

// GET /Articles: Get logged-in user’s Articles (or all if admin)
// routes/Articles.router.mjs
// ... imports ...

// ... router setup and validate function ...

// This route is now public for viewing, but actions are protected.
// router.use(authenticate); // We'll apply this selectively

// GET /articles: Publicly accessible list
router.get("/", getAllArticles);

// GET /articles/:id: Publicly accessible detail view
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid Article ID")],
  validate,
  getArticleById
);

// POST /articles: PROTECTED - Create an article
router.post(
  "/",
  authenticate, // Protect this specific route
  upload.single("coverImage"),
  [
    // REFACTORED: Update validation rules
    body("title").notEmpty().withMessage("Title is required").trim(),
    body("summary").notEmpty().withMessage("Summary is required").trim(),
    body("content").notEmpty().withMessage("Content is required"),
    body("category").isMongoId().withMessage("A valid category ID is required"),
    body("tags")
      .optional()
      .isArray()
      .withMessage("Tags must be an array of IDs"),
  ],
  validate,
  addArticle
);

// PATCH /articles/:id: PROTECTED - Update an article
router.patch(
  "/:id",
  authenticate, // Protect this specific route
  upload.single("coverImage"),
  [
    param("id").isMongoId().withMessage("Invalid Article ID"),
    // Add optional validation for new fields
    body("title").optional().notEmpty().trim(),
    body("summary").optional().notEmpty().trim(),
    // ... etc for other fields
  ],
  validate,
  updateArticle // Auth is handled in the service for ownership check
);

// DELETE /articles/:id: PROTECTED - Delete an article (admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"), // Only admins can delete
  [param("id").isMongoId().withMessage("Invalid Article ID")],
  validate,
  deleteArticle
);

export default router;
