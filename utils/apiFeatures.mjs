class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.pagination = {};
  }
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "q"];
    excludedFields.forEach((el) => delete queryObj[el]);
    for (const key in queryObj) {
      const value = queryObj[key];
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        for (const op in value) {
          if (["gte", "gt", "lte", "lt"].includes(op)) {
            queryObj[key][`$${op}`] = Number(value[op]);
            delete queryObj[key][op]; 
          }
        }
      }
      else if (
        (key === "category" || key === "brand") &&
        typeof value === "string" &&
        value.includes(",")
      ) {
        queryObj[key] = { $in: value.split(",") };
      }
    }
    this.query = this.query.find(queryObj);
    return this;
  }
  searchText() {
    if (this.queryString.q) {
      const regex = new RegExp(this.queryString.q, "i");
      this.query = this.query.find({
        $or: [{ name: regex }, { description: regex }],
      });
    }
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(`${sortBy} _id`);
    } else {
      this.query = this.query.sort("-createdAt _id");
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 15;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }
}
export default APIFeatures;