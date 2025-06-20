import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import UserNotFoundException from "../exceptions/UserNotFoundException.mjs";
const signToken = (id, role, secret, expiresIn) => {
  return jwt.sign({ id, role }, secret, { expiresIn });
};
class AuthService {
  async registerUser(userData) {
    const { name, email, password, passwordConfirm } = userData; 
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new GenericException(409, "User with this email already exists."); 
    }
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
      role: "user", 
    });
    newUser.password = undefined;
    return newUser;
  }
  async loginUser(email, password) {
    if (!email || !password) {
      throw new GenericException(400, "Please provide email and password!");
    }
    const user = await User.findOne({ email }).select("+password"); 
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new GenericException(401, "Incorrect email or password"); 
    }
    const accessToken = this.createAccessToken(user);
    const refreshToken = this.createRefreshToken(user);
    return { user, accessToken, refreshToken };
  }
  createAccessToken(user) {
    return signToken(
      user._id,
      user.role,
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRES_IN
    );
  }
  async getMe(userId) {
    const user = await User.findById(userId).select("-password"); 
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }
  createRefreshToken(user) {
    return signToken(
      user._id,
      user.role,
      process.env.JWT_REFRESH_SECRET,
      process.env.JWT_REFRESH_EXPIRES_IN
    );
  }
  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        throw new GenericException(
          401,
          "User belonging to this token no longer exists."
        );
      }
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        throw new GenericException(
          401,
          "User recently changed password! Please log in again."
        );
      }
      return freshUser;
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new GenericException(
          401,
          "Refresh token has expired. Please log in again."
        );
      }
      throw new GenericException(401, "Invalid refresh token.");
    }
  }
}
export default new AuthService();