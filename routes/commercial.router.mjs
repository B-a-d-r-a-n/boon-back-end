import express from "express";
import { getAllCommercials } from "../controllers/commercial.controller.mjs";
const router = express.Router();
router.get("/", getAllCommercials);
export default router;