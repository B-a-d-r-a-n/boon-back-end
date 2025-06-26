import UserService from "../services/user.service.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import userService from "../services/user.service.mjs";
import FormData from "form-data";
import axios from "axios";
export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userService.findUserById(userId);
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUser(req.user._id, req.body);
    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyComments = async (req, res, next) => {
  try {
    const comments = await userService.getUserComments(req.user._id, req.query);
    res.status(200).json({ status: "success", data: comments });
  } catch (error) {
    next(error);
  }
};

export const getMyStarredArticles = async (req, res, next) => {
  try {
    const articles = await userService.getStarredArticles(
      req.user._id,
      req.query
    );
    res.status(200).json({ status: "success", data: articles });
  } catch (error) {
    next(error);
  }
};

export const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new GenericException(400, "Please upload a file.");
    }

    // Now, `new FormData()` will create an instance of the correct class from the library.
    const formData = new FormData();

    // The `form-data` library correctly handles Buffers as the second parameter.
    formData.append("image", req.file.buffer, {
      filename: req.file.originalname,
    });

    const imgbbResponse = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      // The .getHeaders() method is specific to the `form-data` library
      // and is crucial for Axios to send the correct multipart boundary.
      { headers: formData.getHeaders() }
    );

    let newAvatarUrl;
    if (imgbbResponse.data && imgbbResponse.data.success) {
      newAvatarUrl = imgbbResponse.data.data.thumb.url;
    } else {
      // It's better to log the actual response from ImgBB for debugging.
      console.error("ImgBB upload failed:", imgbbResponse.data);
      throw new GenericException(500, "Failed to upload avatar to image host.");
    }

    const updatedUser = await UserService.updateUserAvatar(
      req.user._id,
      newAvatarUrl
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    // Pass the error to the global handler
    next(error);
  }
};
