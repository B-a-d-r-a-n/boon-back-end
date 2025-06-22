import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} from "../controllers/auth.controller.mjs";
import validate from "../middleware/validate.mjs";
import { authenticate } from "../middleware/authenticate.mjs";
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, and session management
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the current logged-in user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current user's data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized.
 */
router.get("/me", authenticate, getMe);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, passwordConfirm]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *               passwordConfirm: { type: string, format: password }
 *     responses:
 *       201:
 *         description: User created successfully. Returns tokens and user object.
 *       400:
 *         description: Validation error (e.g., passwords don't match).
 *       409:
 *         description: Email already exists.
 */
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
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful. Returns tokens and user object.
 *       401:
 *         description: Incorrect email or password.
 */
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

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Obtain a new access token using a refresh token
 *     tags: [Authentication]
 *     description: The refresh token must be sent in an httpOnly cookie.
 *     responses:
 *       200:
 *         description: New access token generated successfully.
 *       401:
 *         description: Invalid or missing refresh token.
 */
router.post("/refresh-token", refreshToken);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Authentication]
 *     description: Clears the refresh token cookie, effectively ending the session.
 *     responses:
 *       200:
 *         description: Logged out successfully.
 */
router.post("/logout", logout);
export default router;
