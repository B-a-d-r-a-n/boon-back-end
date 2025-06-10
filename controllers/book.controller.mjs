// controllers/book.controller.mjs
import bookService from "../services/book.service.mjs";
// ... other imports

export const getAllBooks = async (req, res, next) => {
  try {
    const { books, total, pagination } = await bookService.getAllBooks(
      req.query,
      req.user
    );

    res.status(200).json({
      status: "success",
      results: books.length,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data: { books },
    });
  } catch (error) {
    next(error);
  }
};

// getBookById, addBook, updateBook, deleteBook will call their respective service methods
// which now might internally use APIFeatures or parts of it (e.g., for population).
// For getBookById, the service already handles population.
// For create/update, the service handles population after the operation.

export const getBookById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const book = await bookService.getBookById(id, req.user);
    res.status(200).json(book); // Service handles population
  } catch (error) {
    next(error);
  }
};

// addBook, updateBook, deleteBook largely remain the same in the controller,
// as the core logic changes are in the service.
export const addBook = async (req, res, next) => {
  try {
    const { title, author } = req.body;
    const coverImage = req.file ? req.file.filename : undefined;
    const bookData = { title, author };
    if (coverImage) bookData.coverImage = coverImage;
    const newBook = await bookService.createBook(bookData, req.user._id);
    res.status(201).json(newBook);
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { title, author } = req.body;
    const coverImage = req.file ? req.file.filename : undefined;
    const updateDoc = {};
    if (title !== undefined) updateDoc.title = title; // Check for undefined to allow sending empty string
    if (author !== undefined) updateDoc.author = author;
    if (coverImage !== undefined) updateDoc.coverImage = coverImage;
    const updatedBook = await bookService.updateBook(id, updateDoc, req.user);
    res.status(200).json(updatedBook);
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    const id = req.params.id;
    await bookService.deleteBook(id, req.user);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
