import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import supertest from "supertest";
import express from "express";
import booksRouter from "../routes/books.router.mjs"; // Path to your router
import { customExceptionHandler } from "../middleware/customExceptionHandler.mjs"; // Path to your error handler
import GenericException from "../exceptions/GenericException.mjs"; // Import for checking instance
import BookNotFoundException from "../exceptions/BookNotFoundException.mjs"; // Import for checking instance

// --- Mock the controller ---
// Note: The path to 'book.controller.mjs' is relative to *this test file*
// or an absolute path resolution if your Jest config handles it.
// For simplicity, let's assume it's relative from the test file.
// If your router is in 'routes/' and tests are in 'tests/',
// then controller in 'controllers/' would be '../controllers/book.controller.mjs'

// Using unstable_mockModule for ESM
const mockGetAllBooks = jest.fn();
const mockGetBookById = jest.fn();
const mockAddBook = jest.fn();
const mockUpdateBook = jest.fn();
const mockDeleteBook = jest.fn();

jest.unstable_mockModule("../controllers/book.controller.mjs", () => ({
  getAllBooks: mockGetAllBooks,
  getBookById: mockGetBookById,
  addBook: mockAddBook,
  updateBook: mockUpdateBook,
  deleteBook: mockDeleteBook,
}));

// --- Test Application Setup ---
const app = express();
app.use(express.json()); // To parse JSON request bodies
app.use("/books", booksRouter); // Mount the router under test
app.use(customExceptionHandler); // Crucial for testing error responses

const request = supertest(app);

// --- Test Suites ---
describe("Books API - /books", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockGetAllBooks.mockReset();
    mockGetBookById.mockReset();
    mockAddBook.mockReset();
    mockUpdateBook.mockReset();
    mockDeleteBook.mockReset();
  });

  // --- GET /books ---
  describe("GET /books", () => {
    test("should return all books and status 200", async () => {
      const mockBooks = [{ _id: "1", title: "Book 1", author: "Author 1" }];
      // Mock the controller function: it should call res.status(200).json(...)
      // So we don't need it to "return" anything for supertest,
      // but we simulate what it does to the response object.
      mockGetAllBooks.mockImplementation(async (req, res) => {
        res.status(200).json(mockBooks);
      });

      const response = await request.get("/books");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBooks);
      expect(mockGetAllBooks).toHaveBeenCalledTimes(1);
    });

    test("should return 500 if controller throws an error", async () => {
      mockGetAllBooks.mockImplementation(async (req, res, next) => {
        next(new Error("Database error")); // Simulate a generic error
      });

      const response = await request.get("/books");
      expect(response.status).toBe(500);
      expect(response.body.message).toBe("An unexpected error occurred"); // Or your custom error handler's message
    });
  });

  // --- GET /books/:id ---
  describe("GET /books/:id", () => {
    const validMongoId = "60d5f77c5e4b2c1f88f7a123";
    const invalidMongoId = "invalid-id";

    test("should return a book by ID and status 200", async () => {
      const mockBook = {
        _id: validMongoId,
        title: "Specific Book",
        author: "Author S",
      };
      mockGetBookById.mockImplementation(async (req, res) => {
        res.status(200).json(mockBook);
      });

      const response = await request.get(`/books/${validMongoId}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBook);
      expect(mockGetBookById).toHaveBeenCalledTimes(1);
    });

    test("should return 404 if book not found", async () => {
      mockGetBookById.mockImplementation(async (req, res, next) => {
        next(new BookNotFoundException(validMongoId));
      });

      const response = await request.get(`/books/${validMongoId}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Book with ID"); // Or your custom error message
    });

    test("should return 400 for invalid book ID format", async () => {
      // This tests the router's express-validator rule
      const response = await request.get(`/books/${invalidMongoId}`);
      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        "Invalid book ID: must be a valid ObjectId"
      );
      expect(mockGetBookById).not.toHaveBeenCalled(); // Controller should not be called
    });
  });

  // --- POST /books ---
  describe("POST /books", () => {
    test("should add a new book and return 201 (no image)", async () => {
      const newBookData = { title: "New Book", author: "New Author" };
      const createdBook = { ...newBookData, _id: "2" };
      mockAddBook.mockImplementation(async (req, res) => {
        res.status(201).json(createdBook);
      });

      const response = await request.post("/books").send(newBookData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdBook);
      expect(mockAddBook).toHaveBeenCalledTimes(1);
      // You might want to check req.body in the mockAddBook if needed
    });

    test("should add a new book with coverImage and return 201", async () => {
      const createdBook = {
        _id: "3",
        title: "Book with Image",
        author: "Author I",
        coverImage: "test-image.jpg",
      };
      mockAddBook.mockImplementation(async (req, res) => {
        // In a real scenario, req.file would be set by multer
        // The mock controller simulates receiving this and adding to DB
        expect(req.file.originalname).toBe("test-image.jpg"); // Check if multer part is simulated
        res.status(201).json({
          ...createdBook,
          coverImage: req.file.filename || "test-image.jpg",
        });
      });

      const response = await request
        .post("/books")
        .field("title", "Book with Image")
        .field("author", "Author I")
        .attach("coverImage", Buffer.from("fake image data"), "test-image.jpg");

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("Book with Image");
      expect(response.body.coverImage).toBeDefined();
      expect(mockAddBook).toHaveBeenCalledTimes(1);
    });

    test("should return 400 if title is missing", async () => {
      const response = await request
        .post("/books")
        .send({ author: "Author Only" });
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Title is required");
      expect(mockAddBook).not.toHaveBeenCalled();
    });
  });

  // --- PUT /books/:id ---
  describe("PUT /books/:id", () => {
    const validMongoId = "60d5f77c5e4b2c1f88f7a123";
    const updateData = { title: "Updated Title" };
    const updatedBook = {
      _id: validMongoId,
      ...updateData,
      author: "Original Author",
    };

    test("should update a book and return 200 (text fields only)", async () => {
      mockUpdateBook.mockImplementation(async (req, res) => {
        res
          .status(200)
          .json({ ...updatedBook, title: req.body.title || updatedBook.title });
      });

      const response = await request
        .put(`/books/${validMongoId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(mockUpdateBook).toHaveBeenCalledTimes(1);
    });

    test("should update a book with a new image and return 200", async () => {
      mockUpdateBook.mockImplementation(async (req, res) => {
        expect(req.file.originalname).toBe("new-cover.jpg");
        res.status(200).json({
          ...updatedBook,
          coverImage: req.file.filename || "new-cover.jpg",
        });
      });

      const response = await request
        .put(`/books/${validMongoId}`)
        .field("title", "Updated Title Again") // Optional: send other fields
        .attach(
          "coverImage",
          Buffer.from("fake new image data"),
          "new-cover.jpg"
        );

      expect(response.status).toBe(200);
      expect(response.body.coverImage).toBeDefined();
      expect(mockUpdateBook).toHaveBeenCalledTimes(1);
    });

    test("should return 404 if book to update is not found", async () => {
      mockUpdateBook.mockImplementation(async (req, res, next) => {
        next(new BookNotFoundException(validMongoId));
      });

      const response = await request
        .put(`/books/${validMongoId}`)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Book with ID");
    });

    test("should return 400 for invalid book ID format on update", async () => {
      const response = await request.put("/books/invalid-id").send(updateData);
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid book ID");
      expect(mockUpdateBook).not.toHaveBeenCalled();
    });

    test("should return 400 if no fields are provided for update", async () => {
      // This tests the custom validator in the router for PUT
      const response = await request.put(`/books/${validMongoId}`).send({});
      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        "At least one field (title, author, or coverImage) is required to update"
      );
      expect(mockUpdateBook).not.toHaveBeenCalled();
    });
  });

  // --- DELETE /books/:id ---
  describe("DELETE /books/:id", () => {
    const validMongoId = "60d5f77c5e4b2c1f88f7a123";

    test("should delete a book and return 204", async () => {
      mockDeleteBook.mockImplementation(async (req, res) => {
        res.status(204).end();
      });

      const response = await request.delete(`/books/${validMongoId}`);
      expect(response.status).toBe(204);
      expect(mockDeleteBook).toHaveBeenCalledTimes(1);
    });

    test("should return 404 if book to delete is not found", async () => {
      mockDeleteBook.mockImplementation(async (req, res, next) => {
        next(new BookNotFoundException(validMongoId));
      });

      const response = await request.delete(`/books/${validMongoId}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Book with ID");
    });

    test("should return 400 for invalid book ID format on delete", async () => {
      const response = await request.delete("/books/invalid-id");
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid book ID");
      expect(mockDeleteBook).not.toHaveBeenCalled();
    });
  });
});
