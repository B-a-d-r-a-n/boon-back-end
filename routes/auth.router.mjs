import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getMe,
  oauthLogin,
} from "../controllers/auth.controller.mjs";
import validate from "../middleware/validate.mjs";
import { authenticate } from "../middleware/authenticate.mjs";
const router = express.Router();
router.get("/me", authenticate, getMe);
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required").trim(),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("passwordConfirm").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  validate,
  register
);
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);
router.post(
  "/oauth",
  [
    body("email")
      .isEmail()
      .withMessage("A valid email is required.")
      .normalizeEmail(),
    body("name").optional().isString(),
    body("avatarUrl").optional().isURL(),
    body("provider")
      .isIn(["google", "facebook"])
      .withMessage("Invalid OAuth provider."),
  ],
  validate,
  oauthLogin
);
export default router;