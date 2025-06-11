// src/controllers/comment.controller.mjs
import CommentService from "../services/comment.service.mjs";

export const postComment = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { text } = req.body;
    const userId = req.user._id; // from `authenticate` middleware

    const newComment = await CommentService.addCommentToArticle(
      articleId,
      text,
      userId
    );

    res.status(201).json({
      status: "success",
      data: {
        comment: newComment,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const postReply = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id; // from `authenticate` middleware

    const newReply = await CommentService.addReplyToComment(
      commentId,
      text,
      userId
    );

    res.status(201).json({
      status: "success",
      data: {
        reply: newReply,
      },
    });
  } catch (error) {
    next(error);
  }
};
