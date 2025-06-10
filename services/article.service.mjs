// services/article.service.mjs
import Article from "../models/article.model.mjs";
import APIFeatures from "../utils/apiFeatures.mjs";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException.mjs";
import GenericException from "../exceptions/GenericException.mjs";

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
      { path: "author", select: "name" },
      { path: "category", select: "name" },
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
      .populate({ path: "category" })
      .populate({ path: "tags" })
      .populate({
        path: "comments", // LEVEL 1: Populate the 'comments' array on the Article
        options: { sort: { createdAt: -1 } }, // Optional: sort top-level comments
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
      // The controller will now pass summary, content, category, tags, etc.
      let newArticle = new Article({ ...articleData, author: userId });
      await newArticle.save();

      // Return the newly created and fully populated article
      return this.getArticleById(newArticle._id);
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
   * REFACTORED: Updates an article.
   */
  async updateArticle(id, updateData, user) {
    const article = await Article.findById(id);
    if (!article) {
      throw new ArticleNotFoundException(id);
    }
    // Authorization: only the author or an admin can update
    if (
      user.role !== "admin" &&
      article.author.toString() !== user._id.toString()
    ) {
      throw new GenericException(
        403,
        "You do not have permission to update this article."
      );
    }

    const updatedArticle = await Article.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return this.getArticleById(updatedArticle._id); // Return fully populated
  }

  /**
   * REFACTORED: Deletes an article and its associated comments.
   */
  async deleteArticle(id, user) {
    const article = await Article.findById(id);
    if (!article) {
      throw new ArticleNotFoundException(id);
    }
    // Authorization is already handled by middleware in the router

    // TODO: Consider a more robust cleanup strategy for production.
    // This deletes comments associated with the article.
    await Comment.deleteMany({ article: id });

    const deletedArticle = await Article.findByIdAndDelete(id);
    return deletedArticle;
  }
}

export default new ArticleService();
