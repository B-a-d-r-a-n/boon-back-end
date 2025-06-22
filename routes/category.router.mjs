import express from "express";
import { getAllCategories } from "../controllers/category.controller.mjs";
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Retrieve all article categories
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get a list of all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: A list of all available categories.
 */
router.get("/", getAllCategories);
export default router;
