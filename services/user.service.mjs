// services/user.service.mjs
import UserNotFoundException from "../exceptions/UserNotFoundException.mjs";
import User from "../models/user.model.mjs";

class UserService {
  async findUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }
  async updateUserAvatar(userId, avatarPath) {
    // Find the user and update the avatarUrl field
    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: avatarPath },
      { new: true, runValidators: true } // Return the updated document
    );
    return user;
  }
}

export default new UserService();
