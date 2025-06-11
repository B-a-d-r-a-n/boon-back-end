// routes/auth.router.mjs
import express from "express";
import { body, param, validationResult } from "express-validator";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/auth.controller.mjs";
import validate from "../middleware/validate.mjs";

const router = express.Router();

// Validator middleware (similar to your books router)
// const validate = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const errorMessages = errors
//       .array()
//       .map((err) => err.msg)
//       .join(", ");
//     throw new GenericException(400, errorMessages);
//   }
//   next();
// };

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
    // Optionally allow 'role' for admin creation by another admin, or during seeding
    // body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
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

router.post("/refresh-token", refreshToken);
router.post("/logout", logout); // Consider making it GET if no body is needed and it's idempotent

export default router;
