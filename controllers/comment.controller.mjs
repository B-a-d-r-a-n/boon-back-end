import CommentService from "../services/comment.service.mjs";
export const getCommentsByArticle = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { comments, total, pagination } =
      await CommentService.getCommentsForArticle(articleId, req.query);
    res.status(200).json({
      pagination: {
        currentPage: pagination.page,
        itemsPerPage: pagination.limit,
        totalItems: total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page * pagination.limit < total,
        hasPrevPage: pagination.page > 1,
      },
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};
export const updateCommentController = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const user = req.user;
    const updatedComment = await CommentService.updateComment(
      commentId,
      text,
      user
    );
    res.status(200).json({
      status: "success",
      data: {
        comment: updatedComment,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const postComment = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { text } = req.body;
    const userId = req.user._id; 
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
    const userId = req.user._id; 
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
export const deleteComment = async (req, res, next) => {
  try {
    const id = req.params.commentId;
    console.log("logging from controller id is:", id);
    const deletedComment = await CommentService.deleteComment(id, req.user);
    res.status(200).json(deletedComment);
  } catch (error) {
    next(error);
  }
};