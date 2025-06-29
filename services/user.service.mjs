import UserNotFoundException from "../exceptions/UserNotFoundException.mjs";
import User from "../models/user.model.mjs";
import ApiFeatures from "../utils/apiFeatures.mjs";
import Article from "../models/article.model.mjs";
import Comment from "../models/comment.model.mjs";
import APIFeatures from "../utils/apiFeatures.mjs";

class UserService {
  async findUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }

  async updateUser(userId, userData) {
    const user = await User.findByIdAndUpdate(userId, userData, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }
  async getUserComments(userId, queryString) {
    const query = Comment.find({ author: userId });
    const features = new APIFeatures(query, queryString).sort().paginate();
    const comments = await features.query;
    return comments;
  }
  async applyForAuthor(userId, message) {
    const user = await User.findById(userId);
    if (!user) throw new UserNotFoundException(userId);
    if (user.authorStatus === "pending" || user.authorStatus === "approved") {
      throw new GenericException(
        400,
        "You have already applied or are an author."
      );
    }

    user.authorStatus = "pending";
    user.authorApplicationMessage = message;
    await user.save();

    return user;
  }
  async getStarredArticles(userId, queryString) {
    const user = await User.findById(userId).select("starredArticles").lean();
    if (!user) throw new UserNotFoundException(userId);

    const query = Article.find({ _id: { $in: user.starredArticles } });
    const features = new APIFeatures(query, queryString).sort().populate([
      { path: "author", select: "name avatarUrl" },
      { path: "category", select: "name" },
      { path: "tags", select: "name" },
    ]);

    const articles = await features.query;
    return articles;
  }

  async updateUserAvatar(userId, avatarPath) {
    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: avatarPath },
      { new: true, runValidators: true }
    );
    return user;
  }
}
export default new UserService();
