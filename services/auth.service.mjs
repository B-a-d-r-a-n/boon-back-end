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
  /**
   * CORRECTED: This function's only job is to verify a token string.
   * It does not know about req, res, or next.
   * It either returns a user or throws a specific error.
   */
  async verifyRefreshToken(token) {
    try {
      // 1. Decode the token to get the user ID
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      // 2. Find the user based on the ID from the token
      const freshUser = await User.findById(decoded.id);

      // 3. If the user doesn't exist anymore, throw an error
      if (!freshUser) {
        throw new GenericException(
          401,
          "User belonging to this token no longer exists."
        );
      }

      // 4. (Optional but good) Check if the user changed their password after the token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        throw new GenericException(
          401,
          "User recently changed password! Please log in again."
        );
      }

      // 5. If everything is okay, return the user object
      return freshUser;
    } catch (err) {
      // Catch JWT-specific errors and re-throw them as our GenericException
      if (err.name === "TokenExpiredError") {
        throw new GenericException(
          401,
          "Refresh token has expired. Please log in again."
        );
      }
      // For any other JWT error (e.g., malformed token)
      throw new GenericException(401, "Invalid refresh token.");
    }
  }
}

export default new AuthService();
