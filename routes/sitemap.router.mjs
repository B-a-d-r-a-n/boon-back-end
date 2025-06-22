import express from "express";
import { getSitemap } from "../controllers/sitemap.controller.mjs";

const router = express.Router();

// This route does not need to be protected by authentication.
router.get("/sitemap.xml", getSitemap);

export default router;
