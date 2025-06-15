import Tag from "../models/tag.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";

class TagService {
  /**
   * Retrieves all tags from the database.
   */
  async getAllTags() {
    const tags = await Tag.find().sort({ name: "asc" });
    return tags;
  }

  /**
   * Creates a new tag if it doesn't already exist.
   * This is for the "create your own" feature.
   */
  async createTag(tagName) {
    // Check if tag already exists (case-insensitive)
    const existingTag = await Tag.findOne({
      name: { $regex: new RegExp(`^${tagName}$`, "i") },
    });
    if (existingTag) {
      throw new GenericException(409, `Tag "${tagName}" already exists.`);
    }

    const newTag = await Tag.create({ name: tagName });
    return newTag;
  }
}

export default new TagService();
