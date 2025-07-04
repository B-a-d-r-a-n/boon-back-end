import axios from "axios";
import GenericException from "../exceptions/GenericException.mjs";
import FormData from "form-data";
import productService from "../services/product.service.mjs";
export const getAllProducts = async (req, res, next) => {
  try {
    const { products, total, pagination, priceRange } =
      await productService.getAllProducts(req.query);
    res.status(200).json({
      pagination: {
        currentPage: pagination.page,
        itemsPerPage: pagination.limit,
        totalItems: total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page * pagination.limit < total,
        hasPrevPage: pagination.page > 1,
      },
      data: products,
      priceRange,
    });
  } catch (error) {
    next(error);
  }
};
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};
export const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const reviewData = { rating, comment };
    const product = await productService.createProductReview(
      req.params.id,
      reviewData,
      req.user._id
    );
    res
      .status(201)
      .json({ status: "success", message: "Review added.", data: product });
  } catch (error) {
    next(error);
  }
};
export const addProduct = async (req, res, next) => {
  try {
    const { name, brand, category, description, price, stockCount } = req.body;
    const productData = {
      name,
      brand,
      category,
      description,
      price,
      stockCount,
      images: [],
    };
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
        productData.images.push(imgbbResponse.data.data.url);
      }
    }
    const newProduct = await productService.createProduct(
      productData,
      req.user._id
    );
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};
export const updateProduct = async (req, res, next) => {
  try {
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
        updateData.images = [imgbbResponse.data.data.url];
      }
    }
    delete updateData.user;
    delete updateData.reviews;
    const updatedProduct = await productService.updateProduct(
      req.params.id,
      updateData,
      req.user
    );
    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};
export const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
