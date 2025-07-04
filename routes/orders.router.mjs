import express from "express";
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToDelivered,
} from "../controllers/order.controller.mjs";
import { authenticate } from "../middleware/authenticate.mjs";
import { authorize } from "../middleware/authorize.mjs";
import { param } from "express-validator";
import validate from "../middleware/validate.mjs";
const router = express.Router();
router.route("/").post(authenticate, addOrderItems);
router.route("/myorders").get(authenticate, getMyOrders);
router.route("/:id/deliver").patch(
  authenticate,
  authorize("admin"), 
  [param("id").isMongoId().withMessage("Invalid Order ID")],
  validate,
  updateOrderToDelivered
);
router.route("/:id").get(authenticate, getOrderById);
export default router;