// controllers/article.controller.mjs

import GenericException from "../exceptions/GenericException.mjs"; // Good to have for validation

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
    const article = await ArticleService.getArticleById(id, req.user);
    res.status(200).json(article);
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// ★★★ UPDATED CONTROLLER FOR CREATING AN ARTICLE ★★★
// =========================================================================
export const addArticle = async (req, res, next) => {
  try {
    // 1. Destructure all expected fields from the request body
    const { title, summary, content, category } = req.body;
    let { tags } = req.body; // Handle tags separately as it might be a string

    if (tags && typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
        if (!Array.isArray(tags)) {
          throw new Error();
        }
      } catch (e) {
        throw new GenericException(
          400,
          "Tags must be a valid JSON array string."
        );
      }
    }
    // 2. Handle the file upload from Multer
    // Multer places the file info in req.file
    // The path property gives the location on disk, e.g., 'uploads/covers/cover-123.jpg'
    const coverImageUrl = req.file ? req.file.path : undefined;

    // Assemble the data object. We are now saving a full URL.
    const articleData = {
      title,
      summary,
      content,
      category,
      tags,
      coverImageUrl,
    };

    const newArticle = await ArticleService.createArticle(
      articleData,
      req.user._id
    );

    res.status(201).json(newArticle);
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// ★★★ UPDATED CONTROLLER FOR UPDATING AN ARTICLE ★★★
// =========================================================================
export const updateArticle = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Start with the text fields from the body
    const updateData = { ...req.body };

    // 1. Handle a potential file upload for updating the cover image
    if (req.file) {
      // Get the new URL from Cloudinary.
      updateData.coverImageUrl = req.file.path;
    }

    // 2. Parse tags if they were updated and sent as a string
    if (updateData.tags && typeof updateData.tags === "string") {
      try {
        updateData.tags = JSON.parse(updateData.tags);
        if (!Array.isArray(updateData.tags)) {
          throw new Error();
        }
      } catch (e) {
        throw new GenericException(
          400,
          "Tags must be a valid JSON array string."
        );
      }
    }

    // 3. Remove any fields that should not be updated by the user
    delete updateData.author;
    delete updateData.comments;

    // 4. Call the service to perform the update
    const updatedArticle = await ArticleService.updateArticle(
      id,
      updateData,
      req.user // Pass the full user object for ownership checks in the service
    );

    res.status(200).json(updatedArticle);
  } catch (error) {
    next(error);
  }
};
export const deleteArticle = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deletedArticle = await ArticleService.deleteArticle(id, req.user);
    res.status(200).json(deletedArticle); // Use .send() for 204 No Content
  } catch (error) {
    next(error);
  }
};
