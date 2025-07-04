import express from "express";
import { getAllDeliveryMethods } from "../controllers/delivery.controller.mjs";
const router = express.Router();
router.get("/", getAllDeliveryMethods);
export default router;