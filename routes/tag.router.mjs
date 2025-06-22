import express from "express";
import { getAllTags, createTag } from "../controllers/tag.controller.mjs";
import { authenticate } from "../middleware/authenticate.mjs";
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: Retrieve and manage tags
 */

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Get a list of all tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: A list of all available tags.
 */
router.get("/", getAllTags);
/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Create a new tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Tag created successfully.
 *       409:
 *         description: Tag with that name already exists.
 */
router.post("/", authenticate, createTag);
export default router;
