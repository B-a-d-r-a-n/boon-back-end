import tagService from "../services/tag.service.mjs";

export const getAllTags = async (req, res, next) => {
  try {
    const tags = await tagService.getAllTags();
    res.status(200).json({
      status: "success",
      results: tags.length,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ status: "fail", message: "Tag name is required." });
    }
    const newTag = await tagService.createTag(name);
    res.status(201).json({
      status: "success",
      data: newTag,
    });
  } catch (error) {
    next(error);
  }
};
