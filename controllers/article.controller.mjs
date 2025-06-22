import axios from "axios";
import GenericException from "../exceptions/GenericException.mjs";
import ArticleService from "../services/article.service.mjs";
import FormData from "form-data";

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
export const addArticle = async (req, res, next) => {
  try {
    const { title, summary, content, category } = req.body;
    let { tags } = req.body;

    if (tags && typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
        if (!Array.isArray(tags)) throw new Error();
      } catch (e) {
        throw new GenericException(
          400,
          "Tags must be a valid JSON array string."
        );
      }
    }

    const articleData = { title, summary, content, category, tags };

    if (req.file) {
      const formData = new FormData();
      formData.append("image", req.file.buffer, {
        filename: req.file.originalname,
      });

      const imgbbResponse = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        formData,
        { headers: formData.getHeaders() }
      );

      if (imgbbResponse.data.success) {
        articleData.coverImageUrl = imgbbResponse.data.data.url;
      }
    }

    const newArticle = await ArticleService.createArticle(
      articleData,
      req.user._id
    );

    res.status(201).json(newArticle);
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updateData = { ...req.body };

    if (req.file) {
      const formData = new FormData();
      formData.append("image", req.file.buffer, {
        filename: req.file.originalname,
      });

      const imgbbResponse = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        formData,
        { headers: formData.getHeaders() }
      );

      if (imgbbResponse.data.success) {
        updateData.coverImageUrl = imgbbResponse.data.data.url;
      }
    }

    if (updateData.tags && typeof updateData.tags === "string") {
      try {
        updateData.tags = JSON.parse(updateData.tags);
        if (!Array.isArray(updateData.tags)) throw new Error();
      } catch (e) {
        throw new GenericException(
          400,
          "Tags must be a valid JSON array string."
        );
      }
    }

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
    const deletedArticle = await ArticleService.deleteArticle(id, req.user);
    res.status(200).json(deletedArticle);
  } catch (error) {
    next(error);
  }
};
