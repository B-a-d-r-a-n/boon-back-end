// src/services/comment.service.mjs
import Comment from "../models/comment.model.mjs";
import Article from "../models/article.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException.mjs";
import CommentNotFoundException from "../exceptions/CommentNotFoundException.mjs";
import APIFeatures from "../utils/apiFeatures.mjs";

/**
 * A private helper function to recursively delete a comment and all its replies.
 * This should NOT be exported or called directly from the controller.
 * @param {string} commentId - The ID of the comment to start deleting from.
 */
async function _deleteCommentAndChildren(commentId) {
  // 1. Find the comment to get its list of replies
  const comment = await Comment.findById(commentId);

  // If the comment doesn't exist (e.g., already deleted by another recursive call), stop.
  if (!comment) return;

  // 2. If this comment has replies, recursively call this function for each reply
  if (comment.replies && comment.replies.length > 0) {
    // We use Promise.all to run the deletions of all children in parallel for efficiency
    await Promise.all(
      comment.replies.map((replyId) => _deleteCommentAndChildren(replyId))
    );
  }

  // 3. After all children are gone, delete the comment itself
  return await Comment.findByIdAndDelete(commentId);
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

    // The base query finds all comments whose ID is in our top-level list.
    const baseQuery = Comment.find({ _id: { $in: topLevelCommentIds } });

    // Use APIFeatures for pagination and sorting
    const features = new APIFeatures(baseQuery, queryString)
      .sort() // Allows sorting comments (e.g., ?sort=-createdAt)
      .paginate();

    // Now, populate the results after pagination
    const populateOptions = [
      {
        path: "author", // Rule 1: Populate the author of the top-level comment
        select: "name avatarUrl",
      },
      {
        path: "replies", // Rule 2: Populate the replies of the top-level comment
        populate: {
          path: "author", // Deep populate: For each reply, populate ITS author
          select: "name avatarUrl",
        },
      },
    ];

    // Apply the array of population rules
    features.query = features.query.populate(populateOptions);

    const comments = await features.query;

    // Get total count for pagination metadata
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
    // 1. Find the target comment in one go. We need it for authorization and to find its parent.
    const commentToDelete = await Comment.findById(commentId).populate(
      "author"
    );

    // 2. Handle not found case
    if (!commentToDelete) {
      throw new CommentNotFoundException(commentId);
    }

    // 3. Perform authorization check here. This is the correct layer for this logic.
    if (
      user.role !== "admin" &&
      commentToDelete.author._id.toString() !== user._id.toString()
    ) {
      throw new GenericException(
        403,
        "You do not have permission to delete this comment."
      );
    }

    // 4. Clean up the reference from the parent document (either an Article or another Comment)
    // This is a crucial step to prevent "dangling" IDs in your database.

    // Check if any other comment lists this one as a reply
    await Comment.updateMany(
      { replies: commentToDelete._id },
      { $pull: { replies: commentToDelete._id } }
    );
    // Check if any article lists this one as a top-level comment
    await Article.updateMany(
      { comments: commentToDelete._id },
      { $pull: { comments: commentToDelete._id } }
    );

    // 5. Start the recursive deletion process
    // Deletion is successful, no need to return anything.
    return await _deleteCommentAndChildren(commentId);
  }
}

export default new CommentService();
