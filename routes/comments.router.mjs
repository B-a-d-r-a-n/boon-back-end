// src/routes/comment.router.mjs
import express from "express";
import { body, param } from "express-validator";
import { authenticate } from "../middleware/authenticate.mjs";
import { postComment, postReply } from "../controllers/comment.controller.mjs";
import validate from "../middleware/validate.mjs";

const router = express.Router();

// All comment/reply actions require a user to be logged in.
router.use(authenticate);

// --- Route for posting a reply to a specific comment ---
// We define this first as it's more specific than the other route.

// Note: We don't have a top-level POST /comments route.
// Comments are always created in the context of an article.

// We will mount this router in app.mjs at /api/v1/comments

export default router;
