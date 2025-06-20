import User from "../models/user.model.mjs";
class APIFeatures {
  constructor(query, queryString, model = null) {
    this.query = query;
    this.queryString = queryString;
    this.model = model;
    this.pagination = {};
  }
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "q"];
    excludedFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }
  async searchText() {
    if (this.queryString.q) {
      const searchQuery = this.queryString.q;
      const matchingAuthors = await User.find({
        name: { $regex: searchQuery, $options: "i" },
      }).select("_id");
      const authorIds = matchingAuthors.map((author) => author._id);
      const searchCriteria = {
        $or: [
          { $text: { $search: searchQuery } },
          { author: { $in: authorIds } },
        ],
      };
      this.query = this.query.find(searchCriteria);
    }
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      if (this.queryString.q) {
        this.query = this.query.sort({ score: { $meta: "textScore" } });
      } else {
        this.query = this.query.sort("-createdAt");
      }
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v -content");
    }
    return this;
  }
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }
  populate(populateOptions) {
    if (populateOptions) {
      this.query = this.query.populate(populateOptions);
    }
    return this;
  }
}
export default APIFeatures;