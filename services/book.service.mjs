// services/book.service.mjs
import Book from "../models/book.model.mjs";
import APIFeatures from "../utils/apiFeatures.mjs"; // Adjust path
import BookNotFoundException from "../exceptions/BookNotFoundException.mjs";
import GenericException from "../exceptions/GenericException.mjs";

class BookService {
  /**
   * Retrieves books using APIFeatures.
   * @param {object} queryString - req.query from the controller.
   * @param {object} user - The authenticated user object (req.user).
   * @returns {Promise<{books: Array, total: number, pagination: object}>}
   */
  async getAllBooks(queryString, user) {
    // For counting total documents matching filters (before pagination)
    const countFeatures = new APIFeatures(Book.find(), queryString, Book)
      .filter(user) // Apply user-based and other filters
      .search(); // Apply search if present
    const total = await Book.countDocuments(countFeatures.query.getFilter()); // Get filter conditions from query

    // For fetching the paginated, sorted, and field-selected documents
    const features = new APIFeatures(Book.find(), queryString, Book)
      .filter(user)
      .search()
      .sort()
      .limitFields()
      .paginate()
      .populate(); // Default populate for createdBy

    const books = await features.query; // Execute the final query

    return { books, total, pagination: features.pagination };
  }

  async getBookById(id, user) {
    const features = new APIFeatures(Book.findById(id), {}, Book) // No queryString needed for findById usually
      .populate(); // Populate createdBy
    const book = await features.query;

    if (!book) {
      throw new BookNotFoundException(id);
    }
    // Authorization check (can also be a separate middleware or helper)
    if (
      user.role !== "admin" &&
      book.createdBy._id.toString() !== user._id.toString()
    ) {
      throw new GenericException(
        403,
        "You do not have permission to view this book."
      );
    }
    return book;
  }

  // CreateBook, UpdateBook, DeleteBook remain largely the same,
  // but they might benefit from populating createdBy consistently after creation/update.

  async createBook(bookData, userId) {
    try {
      let newBook = new Book({ ...bookData, createdBy: userId });
      await newBook.save();
      // Populate after save
      newBook = await Book.findById(newBook._id).populate({
        path: "createdBy",
        select: "name email",
      });
      return newBook;
    } catch (error) {
      // ... error handling ...
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors)
          .map((e) => e.message)
          .join(", ");
        throw new GenericException(400, `Validation failed: ${messages}`);
      }
      throw error;
    }
  }

  async updateBook(id, updateData, user) {
    let book = await Book.findById(id);
    if (!book) {
      throw new BookNotFoundException(id);
    }
    try {
      const updatedBook = await Book.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate({ path: "createdBy", select: "name email" }); // Populate

      return updatedBook;
    } catch (error) {
      // ... error handling ...
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors)
          .map((e) => e.message)
          .join(", ");
        throw new GenericException(400, `Validation failed: ${messages}`);
      }
      throw error;
    }
  }

  async deleteBook(id, user) {
    // user passed for consistency, authz done by middleware
    const book = await Book.findById(id);
    if (!book) {
      throw new BookNotFoundException(id);
    }
    // Role check is already done by authorize('admin') middleware for this route
    await Book.findByIdAndDelete(id);
    return book;
  }
}

export default new BookService();
