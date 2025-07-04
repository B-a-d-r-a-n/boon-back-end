import Product from "../models/product.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import APIFeatures from "../utils/apiFeatures.mjs";
class ProductService {
  async getAllProducts(queryString) {
    const features = new APIFeatures(Product.find(), queryString)
      .searchText()
      .filter();
    const filterQuery = features.query.getFilter();
    const [priceAgg, total] = await Promise.all([
      Product.aggregate([
        { $match: filterQuery },
        {
          $group: {
            _id: null,
            min: { $min: "$price" },
            max: { $max: "$price" },
          },
        },
      ]),
      Product.countDocuments(filterQuery),
    ]);
    const priceRange = priceAgg[0]
      ? { min: priceAgg[0].min, max: priceAgg[0].max }
      : { min: 0, max: 0 };
    features.sort().paginate();
    const products = await features.query.populate("brand", "name");
    return { products, total, pagination: features.pagination, priceRange };
  }
  async getProductBySlug(slug) {
    const product = await Product.findOne({ slug })
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          model: "User",
          select: "name avatarUrl",
        },
      })
      .populate("brand", "name");
    if (!product) {
      throw new GenericException(404, `Product ${slug} wasn't found`);
    }
    return product;
  }
  async createProduct(productData, userId) {
    const product = new Product({
      ...productData,
      slug: slugify(name, { lower: true, strict: true }),
      user: userId,
    });
    const createdProduct = await product.save();
    return createdProduct;
  }
  async createProductReview(productId, reviewData, user) {
    const { rating, comment } = reviewData;
    const product = await Product.findById(productId);
    if (!product) {
      throw new GenericException(404, "Product not found");
    }
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === user._id.toString()
    );
    if (alreadyReviewed) {
      throw new GenericException(
        400,
        "You have already reviewed this product."
      );
    }
    const review = {
      name: user.name, 
      rating: Number(rating),
      comment,
      user: user._id, 
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
    await product.save();
    return product;
  }
  async updateProduct(productId, updateData, user) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new GenericException(
        404,
        `Product with id ${productId} wasn't found`
      );
    }
    if (
      product.user.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw new GenericException(
        403,
        "You do not have permission to update this product."
      );
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
    return updatedProduct;
  }
  async deleteProduct(productId, user) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new GenericException(
        404,
        `Product with id ${productId} wasn't found`
      );
    }
    if (
      product.user.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw new GenericException(
        403,
        "You do not have permission to delete this product."
      );
    }
    await Product.findByIdAndDelete(productId);
    return { message: "Product deleted successfully." };
  }
}
export default new ProductService();