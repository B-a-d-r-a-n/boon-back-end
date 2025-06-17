import UserService from "../services/user.service.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import userService from "../services/user.service.mjs";

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
export const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new GenericException(400, "Please upload a file.");
    }

    const newAvatarUrl = req.file.path;

    // req.user is from the `authenticate` middleware
    const updatedUser = await UserService.updateUserAvatar(
      req.user._id,
      newAvatarUrl // Pass the full URL to the service
    );

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
