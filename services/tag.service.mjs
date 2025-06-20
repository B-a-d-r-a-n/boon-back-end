import Tag from "../models/tag.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
class TagService {
  async getAllTags() {
    const tags = await Tag.find().sort({ name: "asc" });
    return tags;
  }
  async createTag(tagName) {
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