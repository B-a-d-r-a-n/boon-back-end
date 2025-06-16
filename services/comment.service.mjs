// src/services/comment.service.mjs
import Comment from "../models/comment.model.mjs";
import Article from "../models/article.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException.mjs";
import CommentNotFoundException from "../exceptions/CommentNotFoundException.mjs";
import APIFeatures from "../utils/apiFeatures.mjs";

/**
 * A private helper function to recursively delete a comment and all its children.
 * This should NOT be exported or called directly from the controller.
 * @param {string} commentId - The ID of the comment to start deleting from.
 */
async function _deleteCommentAndChildren(commentId) {
  const comment = await Comment.findById(commentId);
  if (!comment) return;

  if (comment.replies && comment.replies.length > 0) {
    await Promise.all(
      comment.replies.map((replyId) => _deleteCommentAndChildren(replyId))
    );
  }

  await Comment.findByIdAndDelete(commentId);
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
    // 1. Check if the article exists
    const article = await Article.findById(articleId);
    if (!article) {
      throw new ArticleNotFoundException(articleId);
    }

    // 2. Create the new comment document
    let newComment = new Comment({
      text,
      author: userId,
      article: articleId,
    });
    await newComment.save();

    // 3. Add the new comment's ID to the article's comments array
    article.comments.push(newComment._id);
    await article.save();

    // 4. Populate the author details before returning for a rich response
    newComment = await newComment.populate({
      path: "author",
      select: "name avatarUrl",
    });

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
    // 1. Check if the parent comment exists
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      throw new CommentNotFoundException(parentCommentId);
    }

    // 2. Create the new reply (which is also a Comment document)
    // We link it back to the original article for context.
    let newReply = new Comment({
      text,
      author: userId,
      article: parentComment.article,
    });
    await newReply.save();

    // 3. Add the new reply's ID to the parent comment's replies array
    parentComment.replies.push(newReply._id);
    await parentComment.save();

    // 4. Populate the author details for a rich response
    newReply = await newReply.populate({
      path: "author",
      select: "name avatarUrl",
    });

    return newReply;
  }
  async deleteComment(commentId, user) {
    console.log("logging from service id is:", commentId);

    // 1. Find the target comment first to ensure it exists and for authorization.
    const commentToDelete = await Comment.findById(commentId).populate(
      "author"
    );
    if (!commentToDelete) {
      throw new CommentNotFoundException(commentId);
    }

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

    // 3. Atomically remove the reference to this comment from ANY document that might hold it.
    //    We use Promise.all to run these two cleanup operations in parallel for efficiency.
    await Promise.all([
      // A) Try to remove it from any parent comment's `replies` array.
      Comment.updateOne(
        { replies: commentToDelete._id },
        { $pull: { replies: commentToDelete._id } }
      ),
      // B) Try to remove it from any article's `comments` array.
      Article.updateOne(
        { comments: commentToDelete._id },
        { $pull: { comments: commentToDelete._id } }
      ),
    ]);

    // 4. Start the recursive deletion process to clean up the comment and all its children.
    await _deleteCommentAndChildren(commentId);

    // 5. Return the document that was deleted.
    return commentToDelete;
  }
}

export default new CommentService();
