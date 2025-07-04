import express from "express";
import { getAllBrands } from "../controllers/brand.controller.mjs";
const router = express.Router();
router.get("/", getAllBrands);
export default router;