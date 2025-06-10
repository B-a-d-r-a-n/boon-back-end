// routes/books.router.mjs
import express from "express";
import { body, param, validationResult } from "express-validator";
import GenericException from "../exceptions/GenericException.mjs";
// import apicache from "apicache"; // Caching might need re-evaluation with user-specific data
import upload from "../middleware/multerConfig.mjs";
import {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
} from "../controllers/book.controller.mjs";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.mjs"; // Import authenticate
import { authorize } from "../middleware/authorize.mjs"; // Import authorize

const router = express.Router();
// const cache = apicache.middleware; // Be careful caching authenticated user-specific routes

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    throw new GenericException(400, errorMessages);
  }
  next();
};

// Protect all /books routes with authentication
router.use(authenticate);

// GET /books: Get logged-in user’s books (or all if admin)
router.get("/", /* cache("5 minutes"), - re-evaluate caching */ getAllBooks);

// GET /books/:id
router.get(
  "/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid book ID: must be a valid ObjectId"),
  ],
  validate,
  getBookById
);

// POST /books: Create a book
router.post(
  "/",
  upload.single("coverImage"),
  [
    body("title").notEmpty().withMessage("Title is required").trim().escape(),
    body("author").notEmpty().withMessage("Author is required").trim().escape(),
  ],
  validate,
  addBook
);

// patch /books/:id: Update a book (only if owner)
router.patch(
  "/:id",
  upload.single("coverImage"),
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid book ID: must be a valid ObjectId"),
    body("title")
      .optional()
      .notEmpty()
      .withMessage("Title cannot be empty")
      .trim()
      .escape(),
    body("author")
      .optional()
      .notEmpty()
      .withMessage("Author cannot be empty")
      .trim()
      .escape(),
    body().custom((value, { req }) => {
      if (Object.keys(req.body).length === 0 && !req.file) {
        throw new GenericException(
          400,
          "At least one field (title, author, or coverImage) is required to update"
        );
      }
      return true;
    }),
  ],
  validate,
  // No specific authorize middleware here, as ownership is checked in the service/controller
  updateBook
);

// DELETE /books/:id: Delete a book (only if admin)
router.delete(
  "/:id",
  authorize("admin"), // Only admins can delete
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid book ID: must be a valid ObjectId"),
  ],
  validate,
  deleteBook
);

export default router;
