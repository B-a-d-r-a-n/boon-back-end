import starService from "../services/star.service.mjs";

export const toggleStar = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { _id: userId } = req.user; // From `authenticate` middleware

    const result = await starService.toggleStarOnArticle(articleId, userId);

    res.status(200).json({
      status: "success",
      data: result, // Sends back { starred, newCount }
    });
  } catch (error) {
    next(error);
  }
};
