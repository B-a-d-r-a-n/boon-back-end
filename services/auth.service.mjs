// services/auth.service.mjs
import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs";
import GenericException from "../exceptions/GenericException.mjs";
import UserNotFoundException from "../exceptions/UserNotFoundException.mjs";

const signToken = (id, role, secret, expiresIn) => {
  return jwt.sign({ id, role }, secret, { expiresIn });
};

class AuthService {
  async registerUser(userData) {
    const { name, email, password, passwordConfirm } = userData; //role removed

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new GenericException(409, "User with this email already exists."); // 409 Conflict
    }

    // Note: Password hashing is handled by the User model's pre-save hook
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
      role: "user", // Default to 'user' if not provided
    });

    // Don't send password back, even if select:false (create might return it)
    newUser.password = undefined;
    return newUser;
  }

  async loginUser(email, password) {
    if (!email || !password) {
      throw new GenericException(400, "Please provide email and password!");
    }

    const user = await User.findOne({ email }).select("+password"); // Explicitly select password

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new GenericException(401, "Incorrect email or password"); // Use a more specific UnauthorizedException if you have one
    }

    // If everything ok, send tokens to client
    const accessToken = this.createAccessToken(user);
    const refreshToken = this.createRefreshToken(user);

    // Optionally save refresh token to user document if you want to manage active sessions
    // user.refreshToken = refreshToken;
    // await user.save({ validateBeforeSave: false }); // Don't run other validators here

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
      // Optional: check if refresh token is among active/valid tokens for this user
      // if (freshUser.refreshToken !== token) { // If storing single refresh token per user
      //   throw new GenericException(401, 'Invalid refresh token or session expired.');
      // }
      return freshUser;
    } catch (err) {
      // Handle specific JWT errors like TokenExpiredError, JsonWebTokenError
      if (err.name === "TokenExpiredError") {
        throw new GenericException(
          401,
          "Refresh token expired. Please log in again."
        );
      }
      throw new GenericException(401, "Invalid refresh token.");
    }
  }
}

export default new AuthService();
