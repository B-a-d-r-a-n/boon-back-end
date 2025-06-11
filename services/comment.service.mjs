// src/services/comment.service.mjs
import Comment from "../models/comment.model.mjs";
import Article from "../models/article.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException.mjs";

class CommentService {
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
      throw new GenericException(
        404,
        `Comment with ID ${parentCommentId} not found.`
      );
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
}

export default new CommentService();
