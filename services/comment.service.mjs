import Comment from "../models/comment.model.mjs";
import Article from "../models/article.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException.mjs";
import CommentNotFoundException from "../exceptions/CommentNotFoundException.mjs";
import APIFeatures from "../utils/apiFeatures.mjs";
async function _getReplyIds(commentId) {
  const comment = await Comment.findById(commentId).select("replies").lean();
  if (!comment) return [];
  let ids = [commentId];
  if (comment.replies && comment.replies.length > 0) {
    const childIds = await Promise.all(
      comment.replies.map((replyId) => _getReplyIds(replyId.toString()))
    );
    ids = ids.concat(...childIds);
  }
  return ids;
}
class CommentService {
  async getCommentsForArticle(articleId, queryString) {
    const articleExists = await Article.exists({ _id: articleId });
    if (!articleExists) {
      throw new ArticleNotFoundException(articleId);
    }
    const article = await Article.findById(articleId).select("comments");
    const topLevelCommentIds = article.comments;
    const deepPopulate = {
      path: "replies",
      options: { sort: { createdAt: 1 } },
      populate: [
        { path: "author", select: "name avatarUrl" },
        {
          path: "replies",
          populate: [
            { path: "author", select: "name avatarUrl" },
            {
              path: "replies",
              populate: [
                { path: "author", select: "name avatarUrl" },
              ],
            },
          ],
        },
      ],
    };
    const baseQuery = Comment.find({ _id: { $in: topLevelCommentIds } });
    const features = new APIFeatures(baseQuery, queryString).sort().paginate();
    features.query = features.query.populate([
      { path: "author", select: "name avatarUrl" },
      deepPopulate, 
    ]);
    const comments = await features.query;
    const total = topLevelCommentIds.length;
    return { comments, total, pagination: features.pagination };
  }
  async updateComment(commentId, newText, user) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new CommentNotFoundException(commentId);
    }
    if (comment.author.toString() !== user._id.toString()) {
      throw new GenericException(
        403,
        "You do not have permission to edit this comment."
      );
    }
    comment.text = newText;
    await comment.save({ validateModifiedOnly: true });
    await comment.populate({ path: "author", select: "name avatarUrl" });
    return comment;
  }
  async addCommentToArticle(articleId, text, userId) {
    const article = await Article.findById(articleId);
    if (!article) throw new ArticleNotFoundException(articleId);
    const newComment = new Comment({
      text,
      author: userId,
      article: articleId,
    });
    await newComment.save();
    await Article.findByIdAndUpdate(articleId, {
      $push: { comments: newComment._id },
      $inc: { totalCommentCount: 1 },
    });
    await newComment.populate({ path: "author", select: "name avatarUrl" });
    return newComment;
  }
  async addReplyToComment(parentCommentId, text, userId) {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) throw new CommentNotFoundException(parentCommentId);
    const newReply = new Comment({
      text,
      author: userId,
      article: parentComment.article,
    });
    await newReply.save();
    parentComment.replies.push(newReply._id);
    await parentComment.save();
    await Article.findByIdAndUpdate(parentComment.article, {
      $inc: { totalCommentCount: 1 },
    });
    await newReply.populate({ path: "author", select: "name avatarUrl" });
    return newReply;
  }
  async deleteComment(commentId, user) {
    const commentToDelete = await Comment.findById(commentId).populate(
      "author"
    );
    if (!commentToDelete) throw new CommentNotFoundException(commentId);
    if (
      user.role !== "admin" &&
      commentToDelete.author._id.toString() !== user._id.toString()
    ) {
      throw new GenericException(
        403,
        "You do not have permission to delete this comment."
      );
    }
    const articleId = commentToDelete.article;
    const idsToDelete = await _getReplyIds(commentId);
    const deletedCount = idsToDelete.length;
    if (deletedCount > 0) {
      await Comment.deleteMany({ _id: { $in: idsToDelete } });
    }
    if (deletedCount > 0) {
      await Article.findByIdAndUpdate(articleId, {
        $inc: { totalCommentCount: -deletedCount },
      });
    }
    await Promise.all([
      Comment.updateOne(
        { replies: commentId },
        { $pull: { replies: commentId } }
      ),
      Article.updateOne(
        { comments: commentId },
        { $pull: { comments: commentId } }
      ),
    ]);
    return commentToDelete;
  }
}
export default new CommentService();