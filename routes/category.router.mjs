import express from "express";
import { getAllCategories } from "../controllers/category.controller.mjs";

const router = express.Router();

router.get("/", getAllCategories);

export default router;
