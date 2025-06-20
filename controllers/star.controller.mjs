import starService from "../services/star.service.mjs";
export const toggleStar = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { _id: userId } = req.user; 
    const result = await starService.toggleStarOnArticle(articleId, userId);
    res.status(200).json({
      status: "success",
      data: result, 
    });
  } catch (error) {
    next(error);
  }
};