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
    if (!password || passwordConfirm === undefined) {
      throw new GenericException(
        400,
        "Password and confirmation are required."
      );
    }
    if (password !== passwordConfirm) {
      throw new GenericException(400, "Passwords do not match.");
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new GenericException(
        409,
        "An account with this email already exists."
      );
    }
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
      provider: "credentials",
    });
    const accessToken = this.createAccessToken(newUser);
    return { user: newUser, accessToken };
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
    return { user, accessToken };
  }
  async handleOAuthLogin(profile) {
    const { email, name, avatarUrl, provider } = profile;
    let user = await User.findOne({ email });
    if (user) {
      if (user.provider !== provider) {
        throw new GenericException(
          409,
          `Account exists with a different login method.`
        );
      }
      if (avatarUrl && user.avatarUrl !== avatarUrl) {
        user.avatarUrl = avatarUrl;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      user = await User.create({ name, email, avatarUrl, provider });
    }
    const accessToken = this.createAccessToken(user);
    return { user, accessToken };
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
    const user = await User.findById(userId)
      .select("-password -passwordConfirm")
      .populate({ path: "wishlist", model: "Product" })
      .populate({ path: "cart.product", model: "Product" });
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }
}
export default new AuthService();