import User from "../models/user.model.mjs";

class APIFeatures {
  constructor(query, queryString, model = null) {
    this.query = query;
    this.queryString = queryString;
    this.model = model;
    this.pagination = {};
  }

  filter() {
    // 1. Create a shallow copy of the query string.
    const queryObj = { ...this.queryString };

    // 2. Define fields that are for other methods, not for filtering the database.
    const excludedFields = ["page", "sort", "limit", "fields", "q"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 3. Handle advanced filtering (gte, gt, lte, lt)
    // This part is for queries like ?price[gte]=50
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // 4. Apply the filter to the Mongoose query object.
    // The result of `JSON.parse(queryStr)` will be an object like:
    // { author: 'some-user-id', category: 'some-category-id' }
    // Mongoose's .find() method handles this perfectly.
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }
  /**
   * UPDATED: Renamed from 'search' to 'searchText' for clarity.
   * Now uses the `q` query parameter.
   */
  async searchText() {
    if (this.queryString.q) {
      const searchQuery = this.queryString.q;

      // Now that `User` is imported, this line will work correctly.
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
      // For text searches, sorting by text score is often best.
      // Otherwise, default to createdAt.
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
      // For list views, always exclude the large `content` field.
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
