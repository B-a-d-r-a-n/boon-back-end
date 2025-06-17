import express from "express";
import { param } from "express-validator";
import { authenticate } from "../middleware/authenticate.mjs";
import validate from "../middleware/validate.mjs";
import { toggleStar } from "../controllers/star.controller.mjs";

const router = express.Router();

// The route will be something like: POST /api/v1/articles/:articleId/star
// It's a POST because it changes state.
router.post(
  "/:articleId/star",
  authenticate, // User must be logged in
  [param("articleId").isMongoId().withMessage("Invalid article ID.")],
  validate,
  toggleStar
);

export default router;
