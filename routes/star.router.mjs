import express from "express";
import { param } from "express-validator";
import { authenticate } from "../middleware/authenticate.mjs";
import validate from "../middleware/validate.mjs";
import { toggleStar } from "../controllers/star.controller.mjs";
const router = express.Router();
router.post(
  "/:articleId/star",
  authenticate, 
  [param("articleId").isMongoId().withMessage("Invalid article ID.")],
  validate,
  toggleStar
);
export default router;