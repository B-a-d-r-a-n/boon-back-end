// utils/apiFeatures.mjs
class APIFeatures {
  /**
   * @param {mongoose.Query} query - The Mongoose query object (e.g., Model.find())
   * @param {object} queryString - The query string from the request (req.query)
   * @param {mongoose.Model} model - The Mongoose model being queried (optional, useful for schema checks)
   */
  constructor(query, queryString, model = null) {
    this.query = query; // Mongoose query object
    this.queryString = queryString; // e.g., req.query
    this.model = model; // Mongoose model (optional)
  }

  filter(user = null) {
    // 1A) Basic Filtering (excluding special fields)
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering (gte, gt, lte, lt, ne, in, nin)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|ne|in|nin)\b/g,
      (match) => `$${match}`
    );
    const parsedQueryFilters = JSON.parse(queryStr);

    // Apply user-specific filtering if a user is provided and the model has 'createdBy'
    if (
      user &&
      user.role !== "admin" &&
      this.model &&
      this.model.schema.paths.createdBy
    ) {
      parsedQueryFilters.createdBy = user._id;
    }

    this.query = this.query.find(parsedQueryFilters);
    return this; // To allow chaining
  }

  search() {
    if (this.queryString.search && this.model) {
      // Ensure you have a $text index on the fields you want to search in your model schema
      // Example: bookSchema.index({ title: 'text', author: 'text' });
      const searchFields = Object.keys(this.model.schema.paths).filter(
        (path) => this.model.schema.paths[path].instance === "String"
      );
      // More targeted search:
      // const searchableFields = ['title', 'author']; // Define in model or pass in
      // if (this.model.schema.path('$text')) { // Check if $text index exists

      if (!this.model.schema.get("textIndex")) {
        console.warn(
          `WARN: Text search initiated for model ${this.model.modelName} without a $text index. Search might be inefficient or not work as expected.`
        );
      }
      this.query = this.query.find({
        $text: { $search: this.queryString.search },
      });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else if (this.model && this.model.schema.paths.createdAt) {
      this.query = this.query.sort("-createdAt"); // Default sort
    } else {
      // Add a default sort if createdAt doesn't exist, e.g., by _id or a specific field
      // this.query = this.query.sort('_id');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v"); // Exclude __v by default
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    // We store these for later use in sending response metadata
    this.pagination = { page, limit };
    return this;
  }

  populate(populateOptions) {
    if (populateOptions) {
      if (Array.isArray(populateOptions)) {
        populateOptions.forEach((opt) => {
          this.query = this.query.populate(opt);
        });
      } else {
        this.query = this.query.populate(populateOptions);
      }
    } else if (this.model && this.model.schema.paths.createdBy) {
      // Default populate for 'createdBy' if it exists
      this.query = this.query.populate({
        path: "createdBy",
        select: "name email",
      });
    }
    return this;
  }
}

export default APIFeatures;
