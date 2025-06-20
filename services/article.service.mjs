import Article from "../models/article.model.mjs";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import Comment from "../models/comment.model.mjs";
import APIFeatures from "../utils/apiFeatures.mjs";
const calculateReadingTime = (htmlContent) => {
  if (!htmlContent) return 1;
  const text = htmlContent.replace(/<[^>]+>/g, "");
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 225);
  return Math.max(1, minutes);
};
class ArticleService {
  async getAllArticles(queryString) {
    const populateOptions = [
      { path: "author", select: "name avatarUrl" },
      { path: "category", select: "name" },
      { path: "tags", select: "name" },
    ];
    const countFeatures = new APIFeatures(Article.find(), queryString);
    countFeatures.filter(); 
    await countFeatures.searchText(); 
    const total = await Article.countDocuments(countFeatures.query.getFilter());
    const features = new APIFeatures(Article.find(), queryString);
    features.filter();
    await features.searchText();
    features.sort().limitFields().paginate().populate(populateOptions);
    const articles = await features.query;
    return { articles, total, pagination: features.pagination };
  }
  async getArticleById(id, user) {
    const article = await Article.findById(id)
      .populate({ path: "author", select: "name avatarUrl" })
      .populate({ path: "category", select: "name" })
      .populate({ path: "tags", select: "name" })
      .populate({
        path: "comments", 
        options: { sort: { createdAt: 1 } }, 
        populate: [
          {
            path: "author", 
            select: "name avatarUrl",
          },
          {
            path: "replies", 
            options: { sort: { createdAt: 1 } }, 
            populate: {
              path: "author", 
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
  async createArticle(articleData, userId) {
    try {
      const readTime = calculateReadingTime(articleData.content);
      const newArticleDocument = await Article.create({
        ...articleData,
        author: userId,
        readTimeInMinutes: readTime,
      });
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
    const updatedArticle = await Article.findByIdAndUpdate(id, updateData, {
      new: true, 
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
    if (
      user.role !== "admin" &&
      article.author.toString() !== user._id.toString()
    ) {
      throw new GenericException(
        403,
        "You do not have permission to delete this article."
      );
    }
    await Comment.deleteMany({ article: id });
    const deletedArticle = await Article.findByIdAndDelete(id);
    return deletedArticle;
  }
}
export default new ArticleService();