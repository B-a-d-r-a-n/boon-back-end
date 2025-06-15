// services/article.service.mjs
import Article from "../models/article.model.mjs";
import APIFeatures from "../utils/apiFeatures.mjs";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import Comment from "../models/comment.model.mjs";

const calculateReadingTime = (htmlContent) => {
  if (!htmlContent) return 1;

  // 1. Strip all HTML tags to get plain text.
  const text = htmlContent.replace(/<[^>]+>/g, "");

  // 2. Count the words.
  const wordCount = text.trim().split(/\s+/).length;

  // 3. Calculate minutes and round up to the nearest whole number.
  const minutes = Math.ceil(wordCount / 225);

  // 4. Ensure a minimum of 1 minute.
  return Math.max(1, minutes);
};
class ArticleService {
  /**
   * REFACTORED: Retrieves articles with lean population for list view.
   */
  async getAllArticles(queryString, user) {
    // For counting total documents
    const countQuery = new APIFeatures(Article.find(), queryString, Article)
      .filter(user)
      .search()
      .query.getFilter();
    const total = await Article.countDocuments(countQuery);

    // For fetching paginated data
    const populateOptions = [
      { path: "author", select: "name avatarUrl" },
      { path: "category", select: "name" },
      { path: "tags", select: "name" },
    ];

    const features = new APIFeatures(Article.find(), queryString, Article)
      .filter(user)
      .search()
      .sort()
      .limitFields() // Note: This will now select summary, coverImageUrl etc.
      .paginate()
      .populate(populateOptions);

    const articles = await features.query;

    return { articles, total, pagination: features.pagination };
  }

  /**
   * REFACTORED: Retrieves a single article with deep, nested population.
   */
  // ... inside the getArticleById method ...

  async getArticleById(id, user) {
    const article = await Article.findById(id)
      .populate({ path: "author", select: "name avatarUrl" })
      .populate({ path: "category", select: "name" })
      .populate({ path: "tags", select: "name" })
      .populate({
        path: "comments", // LEVEL 1: Populate the 'comments' array on the Article
        options: { sort: { createdAt: 1 } }, // Optional: sort top-level comments
        populate: [
          {
            path: "author", // LEVEL 2a: For each comment, populate its 'author'
            select: "name avatarUrl",
          },
          {
            path: "replies", // LEVEL 2b: For each comment, populate its 'replies' array
            options: { sort: { createdAt: 1 } }, // Optional: sort replies oldest to newest
            populate: {
              path: "author", // LEVEL 3: For each of those replies, populate ITS 'author'
              select: "name avatarUrl",
            },
          },
        ],
      });

    if (!article) {
      throw new ArticleNotFoundException(id);
    }

    return article;
  }

  /**
   * REFACTORED: Creates an article with all the new fields.
   */
  async createArticle(articleData, userId) {
    try {
      const readTime = calculateReadingTime(articleData.content);

      // The `articleData` object already has the coverImageUrl if it exists.
      // We just create the document with all the provided data.
      const newArticleDocument = await Article.create({
        ...articleData,
        author: userId,
        readTimeInMinutes: readTime,
      });

      // Fetch it back to populate relationships.
      const populatedArticle = await Article.findById(newArticleDocument._id)
        .populate({ path: "author", select: "name avatarUrl" })
        .populate({ path: "category", select: "name" })
        .populate({ path: "tags", select: "name" });

      return populatedArticle;
    } catch (error) {
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors)
          .map((e) => e.message)
          .join(", ");
        throw new GenericException(400, `Validation failed: ${messages}`);
      }
      throw error;
    }
  }

  /**
   * UPDATED: Updates an article. The `updateData` from the controller
   * will contain the new `coverImageUrl` if a new image was uploaded.
   */
  async updateArticle(id, updateData, user) {
    const article = await Article.findById(id);
    if (!article) {
      throw new ArticleNotFoundException(id);
    }
    if (
      user.role !== "admin" &&
      article.author.toString() !== user._id.toString()
    ) {
      throw new GenericException(
        403,
        "You do not have permission to update this article."
      );
    }

    if (updateData.content) {
      updateData.readTimeInMinutes = calculateReadingTime(updateData.content);
    }

    // Find the article by ID and update it with the new data.
    // The `updateData` object will have the `coverImageUrl` already.
    const updatedArticle = await Article.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
      runValidators: true,
    })
      .populate({ path: "author", select: "name avatarUrl" })
      .populate({ path: "category", select: "name" })
      .populate({ path: "tags", select: "name" });

    return updatedArticle;
  }

  async deleteArticle(id, user) {
    const article = await Article.findById(id);
    if (!article) {
      throw new ArticleNotFoundException(id);
    }
    // Authorization is already handled by middleware in the router
    if (
      user.role !== "admin" &&
      article.author.toString() !== user._id.toString()
    ) {
      // If they are neither, throw a Forbidden error
      throw new GenericException(
        403,
        "You do not have permission to delete this article."
      );
    }
    // TODO: Consider a more robust cleanup strategy for production.
    // This deletes comments associated with the article.
    await Comment.deleteMany({ article: id });

    const deletedArticle = await Article.findByIdAndDelete(id);
    return deletedArticle;
  }
}

export default new ArticleService();
