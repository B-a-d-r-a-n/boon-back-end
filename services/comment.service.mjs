// src/services/comment.service.mjs
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
  /**
   * NEW: Retrieves all top-level comments for an article with pagination.
   * This is very similar to getAllArticles.
   * @param {string} articleId - The ID of the article.
   * @param {object} queryString - req.query from the controller for pagination.
   * @returns {Promise<{comments: Array, total: number, pagination: object}>}
   */
  async getCommentsForArticle(articleId, queryString) {
    // First, ensure the article exists.
    const articleExists = await Article.exists({ _id: articleId });
    if (!articleExists) {
      throw new ArticleNotFoundException(articleId);
    }

    // We only want to find TOP-LEVEL comments.
    // We can identify them because their ID will be in the article's `comments` array.
    const article = await Article.findById(articleId).select("comments");
    const topLevelCommentIds = article.comments;

    const deepPopulate = {
      path: "replies",
      options: { sort: { createdAt: 1 } },
      populate: [
        { path: "author", select: "name avatarUrl" },
        {
          // This is the recursive part. We re-apply the same population
          // to the 'replies' field of the document we are currently populating.
          path: "replies",
          populate: [
            { path: "author", select: "name avatarUrl" },
            {
              path: "replies",
              populate: [
                { path: "author", select: "name avatarUrl" },
                // You can continue this pattern as deep as you need.
                // 3-5 levels is often sufficient.
              ],
            },
          ],
        },
      ],
    };

    const baseQuery = Comment.find({ _id: { $in: topLevelCommentIds } });
    const features = new APIFeatures(baseQuery, queryString).sort().paginate();

    // Apply the population rules
    features.query = features.query.populate([
      { path: "author", select: "name avatarUrl" },
      deepPopulate, // Apply our deep population rule for replies
    ]);

    const comments = await features.query;
    const total = topLevelCommentIds.length;

    return { comments, total, pagination: features.pagination };
  }

  /**
   * NEW: Updates the text of a specific comment.
   * @param {string} commentId - The ID of the comment to update.
   * @param {string} newText - The new text for the comment.
   * @param {object} user - The authenticated user performing the action.
   * @returns {Promise<Comment>}
   */
  async updateComment(commentId, newText, user) {
    // 1. Find the comment to ensure it exists and to check ownership.
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new CommentNotFoundException(commentId);
    }

    // 2. Authorization: Only the original author can edit their comment.
    // (Admins could also be allowed if desired: `user.role !== 'admin' && ...`)
    if (comment.author.toString() !== user._id.toString()) {
      throw new GenericException(
        403,
        "You do not have permission to edit this comment."
      );
    }

    // 3. Update the text and save.
    comment.text = newText;
    await comment.save({ validateModifiedOnly: true });

    // 4. Populate and return the updated comment.
    await comment.populate({ path: "author", select: "name avatarUrl" });
    return comment;
  }
  /**
   * Creates a new top-level comment and links it to an article.
   * @param {string} articleId - The ID of the article being commented on.
   * @param {string} text - The content of the comment.
   * @param {string} userId - The ID of the user posting the comment.
   * @returns {Promise<Comment>}
   */
  async addCommentToArticle(articleId, text, userId) {
    const article = await Article.findById(articleId);
    if (!article) throw new ArticleNotFoundException(articleId);

    const newComment = new Comment({
      text,
      author: userId,
      article: articleId,
    });
    await newComment.save();
    // Add the comment reference & increment the total count in one operation.
    await Article.findByIdAndUpdate(articleId, {
      $push: { comments: newComment._id },
      $inc: { totalCommentCount: 1 },
    });

    await newComment.populate({ path: "author", select: "name avatarUrl" });
    return newComment;
  }

  /**
   * Creates a reply to an existing comment.
   * @param {string} parentCommentId - The ID of the comment being replied to.
   * @param {string} text - The content of the reply.
   * @param {string} userId - The ID of the user posting the reply.
   * @returns {Promise<Comment>}
   */
  async addReplyToComment(parentCommentId, text, userId) {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) throw new CommentNotFoundException(parentCommentId);

    const newReply = new Comment({
      text,
      author: userId,
      article: parentComment.article,
    });
    await newReply.save();

    // Add the reply reference to the parent comment
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

    // 2. Authorization check (only the author or an admin can delete).
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
    // 1. Find all IDs in the deletion branch (the comment + all its replies)
    const idsToDelete = await _getReplyIds(commentId);
    const deletedCount = idsToDelete.length;

    // 2. Perform the actual deletion from the Comments collection
    if (deletedCount > 0) {
      await Comment.deleteMany({ _id: { $in: idsToDelete } });
    }

    // 3. Perform a single, efficient decrement on the Article's count
    if (deletedCount > 0) {
      await Article.findByIdAndUpdate(articleId, {
        $inc: { totalCommentCount: -deletedCount },
      });
    }

    // 4. Clean up references from any parent document
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
