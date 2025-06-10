// controllers/article.controller.mjs
import ArticleService from "../services/article.service.mjs";

/**
 * REFACTORED: Formats the response to match the frontend's expectations.
 */
export const getAllArticles = async (req, res, next) => {
  try {
    const { articles, total, pagination } = await ArticleService.getAllArticles(
      req.query,
      req.user
    );

    res.status(200).json({
      pagination: {
        currentPage: pagination.page,
        itemsPerPage: pagination.limit,
        totalItems: total,
        totalPages: Math.ceil(total / pagination.limit),
        // Add this logic if needed by your frontend pagination component
        hasNextPage: pagination.page * pagination.limit < total,
        hasPrevPage: pagination.page > 1,
      },
      data: articles,
    });
  } catch (error) {
    next(error);
  }
};

export const getArticleById = async (req, res, next) => {
  try {
    const id = req.params.id;
    // The service now returns the fully populated article
    const article = await ArticleService.getArticleById(id, req.user);
    res.status(200).json(article);
  } catch (error) {
    next(error);
  }
};

/**
 * REFACTORED: Assembles the full article payload from the request body.
 */
export const addArticle = async (req, res, next) => {
  try {
    // Destructure all the new fields from the body
    const { title, summary, content, category, tags } = req.body;
    const coverImage = req.file ? req.file.path : undefined; // Or filename depending on multer config

    const articleData = { title, summary, content, category, tags };
    if (coverImage) articleData.coverImageUrl = coverImage;

    const newArticle = await ArticleService.createArticle(
      articleData,
      req.user._id
    );
    res.status(201).json(newArticle);
  } catch (error) {
    next(error);
  }
};

/**
 * REFACTORED: Assembles the partial update payload.
 */
export const updateArticle = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updateData = { ...req.body }; // Copy all potential fields
    if (req.file) {
      updateData.coverImageUrl = req.file.path;
    }

    // Remove fields that shouldn't be updated directly, if any
    delete updateData.author;
    delete updateData.comments;

    const updatedArticle = await ArticleService.updateArticle(
      id,
      updateData,
      req.user
    );
    res.status(200).json(updatedArticle);
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const id = req.params.id;
    await ArticleService.deleteArticle(id, req.user);
    res.status(204).send(); // Use .send() for 204 No Content
  } catch (error) {
    next(error);
  }
};
