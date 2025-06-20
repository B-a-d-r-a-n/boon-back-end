import Article from "../models/article.model.mjs";
import User from "../models/user.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException.mjs";
class StarService {
  async toggleStarOnArticle(articleId, userId) {
    const article = await Article.findById(articleId).select(
      "author starredBy"
    );
    if (!article) {
      throw new ArticleNotFoundException(articleId);
    }
    if (article.author.toString() === userId.toString()) {
      throw new GenericException(403, "You cannot star your own article.");
    }
    const isAlreadyStarred = article.starredBy.includes(userId);
    let updateOperation;
    let authorStarUpdate;
    let newCount;
    let starred;
    if (isAlreadyStarred) {
      updateOperation = {
        $pull: { starredBy: userId },
        $inc: { starsCount: -1 },
      };
      authorStarUpdate = { $inc: { totalStars: -1 } };
      newCount = article.starsCount - 1;
      starred = false;
    } else {
      updateOperation = {
        $addToSet: { starredBy: userId }, 
        $inc: { starsCount: 1 },
      };
      authorStarUpdate = { $inc: { totalStars: 1 } };
      newCount = article.starsCount + 1;
      starred = true;
    }
    await Promise.all([
      Article.findByIdAndUpdate(articleId, updateOperation),
      User.findByIdAndUpdate(article.author, authorStarUpdate),
    ]);
    return { starred, newCount };
  }
}
export default new StarService();