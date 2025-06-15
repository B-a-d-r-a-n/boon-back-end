import express from "express";
import { getAllTags, createTag } from "../controllers/tag.controller.mjs";
import { authenticate } from "../middleware/authenticate.mjs"; // Assuming you have auth middleware

const router = express.Router();

router.get("/", getAllTags);
// Creating a tag should be a protected action
router.post("/", authenticate, createTag);

export default router;
