import express from "express";
import { getAllTags, createTag } from "../controllers/tag.controller.mjs";
import { authenticate } from "../middleware/authenticate.mjs"; 
const router = express.Router();
router.get("/", getAllTags);
router.post("/", authenticate, createTag);
export default router;