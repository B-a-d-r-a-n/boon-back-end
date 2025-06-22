import express from "express";
import { param } from "express-validator";
import { authenticate } from "../middleware/authenticate.mjs";
import validate from "../middleware/validate.mjs";
import { toggleStar } from "../controllers/star.controller.mjs";
const router = express.Router();
/**
 * @swagger
 * /articles/{articleId}/star:
 *   post:
 *     summary: Toggle a star on an article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Star toggled successfully. Returns the new state.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 starred: { type: boolean }
 *                 newCount: { type: integer }
 */
router.post(
  "/:articleId/star",
  authenticate,
  [param("articleId").isMongoId().withMessage("Invalid article ID.")],
  validate,
  toggleStar
);
export default router;
