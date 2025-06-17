import Article from "../models/article.model.mjs";
import User from "../models/user.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException.mjs";

class StarService {
  /**
   * Allows a user to star or unstar an article.
   * This is an idempotent "toggle" operation.
   * @param {string} articleId - The ID of the article to star/unstar.
   * @param {string} userId - The ID of the user performing the action.
   * @returns {Promise<{starred: boolean, newCount: number}>} The new state and count.
   */
  async toggleStarOnArticle(articleId, userId) {
    // 1. Find the article and its author
    const article = await Article.findById(articleId).select(
      "author starredBy"
    );
    if (!article) {
      throw new ArticleNotFoundException(articleId);
    }

    // 2. An author cannot star their own article
    if (article.author.toString() === userId.toString()) {
      throw new GenericException(403, "You cannot star your own article.");
    }

    // 3. Check if the user has already starred this article
    const isAlreadyStarred = article.starredBy.includes(userId);

    let updateOperation;
    let authorStarUpdate;
    let newCount;
    let starred;

    if (isAlreadyStarred) {
      // --- UNSTARRING ---
      // Remove the user's ID from the `starredBy` array and decrement the count.
      updateOperation = {
        $pull: { starredBy: userId },
        $inc: { starsCount: -1 },
      };
      // Decrement the author's total stars.
      authorStarUpdate = { $inc: { totalStars: -1 } };
      newCount = article.starsCount - 1;
      starred = false;
    } else {
      // --- STARRING ---
      // Add the user's ID to the `starredBy` array and increment the count.
      updateOperation = {
        $addToSet: { starredBy: userId }, // $addToSet prevents duplicate entries
        $inc: { starsCount: 1 },
      };
      // Increment the author's total stars.
      authorStarUpdate = { $inc: { totalStars: 1 } };
      newCount = article.starsCount + 1;
      starred = true;
    }

    // 4. Perform the updates in parallel for efficiency
    await Promise.all([
      Article.findByIdAndUpdate(articleId, updateOperation),
      User.findByIdAndUpdate(article.author, authorStarUpdate),
    ]);

    return { starred, newCount };
  }
}

export default new StarService();
