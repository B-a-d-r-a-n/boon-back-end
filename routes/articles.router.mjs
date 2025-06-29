import express from "express";
import { body, param } from "express-validator";
import starRouter from "./star.router.mjs";
import {
  getAllArticles,
  getArticleById,
  addArticle,
  updateArticle,
  deleteArticle,
} from "../controllers/article.controller.mjs";
import { authenticate } from "../middleware/authenticate.mjs";
import {
  getCommentsByArticle,
  postComment,
} from "../controllers/comment.controller.mjs";
import upload from "../middleware/multer.mjs";
import validate from "../middleware/validate.mjs";
import { authorize } from "../middleware/authorize.mjs";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: API for managing blog articles
 */

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: Retrieve a list of articles
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search term for article title, summary, or author name.
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category ID.
 *       - in: query
 *         name: author
 *         schema: { type: string }
 *         description: Filter by author ID.
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, oldest, stars] }
 *         description: Sort order.
 *     responses:
 *       200:
 *         description: A paginated list of articles.
 */
router.get("/", getAllArticles);
/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get a single article by its ID
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the article to retrieve.
 *     responses:
 *       200:
 *         description: The requested article.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid Article ID")],
  validate,
  getArticleById
);
/**
 * @swagger
 * /articles/{articleId}/comments:
 *   get:
 *     summary: Get all comments for a specific article
 *     tags: [Articles, Comments]
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: A paginated list of comments.
 */
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

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create a new article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               summary: { type: string }
 *               content: { type: string, description: "The full HTML/Markdown content of the article." }
 *               category: { type: string, description: "The MongoDB ID of the category." }
 *               tags: { type: string, description: "A JSON stringified array of tag IDs, e.g., '[\"id1\",\"id2\"]'." }
 *               coverImage: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Article created. Returns the new article object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 */
router.post(
  "/",
  authenticate,
  // authorize("author", "admin"),
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
/**
 * @swagger
 * /articles/{id}:
 *   patch:
 *     summary: Update an existing article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the article to update.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               summary: { type: string }
 *               content: { type: string }
 *               category: { type: string }
 *               tags: { type: string }
 *               coverImage: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Article updated successfully. Returns the updated article object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       403:
 *         description: Forbidden. User is not the author of the article.
 *       404:
 *         description: Article not found.
 */
router.patch(
  "/:id",
  authenticate,
  // authorize("author", "admin"),
  upload.single("coverImage"),
  [
    param("id").isMongoId().withMessage("Invalid Article ID"),
    body("title").optional().notEmpty().trim(),
    body("summary").optional().notEmpty().trim(),
  ],
  validate,
  updateArticle
);
/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Delete an article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the article to delete.
 *     responses:
 *       204:
 *         description: Article deleted successfully.
 *       403:
 *         description: Forbidden. User is not the author of the article.
 *       404:
 *         description: Article not found.
 */
router.delete(
  "/:id",
  authenticate,
  // authorize("author", "admin"),
  [param("id").isMongoId().withMessage("Invalid Article ID")],
  validate,
  deleteArticle
);
router.use("/", starRouter);
export default router;
