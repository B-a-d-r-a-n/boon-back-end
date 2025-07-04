import authService from "../services/auth.service.mjs";
import GenericException from "../exceptions/GenericException.mjs";
const sendTokenResponse = (user, accessToken, statusCode, res) => {
  const userOutput = { ...user.toObject() };
  delete userOutput.password;
  delete userOutput.passwordChangedAt;
  res.status(statusCode).json({
    status: "success",
    accessToken,
    data: {
      user: userOutput,
    },
  });
};
export const oauthLogin = async (req, res, next) => {
  try {
    const { name, email, avatarUrl, provider } = req.body;
    if (!email || !provider) {
      throw new GenericException(400, "Email and provider are required.");
    }
    const { user, accessToken } = await authService.handleOAuthLogin({
      name,
      email,
      avatarUrl,
      provider,
    });
    sendTokenResponse(user, accessToken, 200, res);
  } catch (error) {
    next(error);
  }
};
export const register = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;
    const { user, accessToken } = await authService.registerUser({
      name,
      email,
      password,
      passwordConfirm,
    });
    sendTokenResponse(user, accessToken, 201, res);
  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken } = await authService.loginUser(email, password);
    sendTokenResponse(user, accessToken, 200, res);
  } catch (error) {
    next(error);
  }
};
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ status: "success", data: { user } });
  } catch (error) {
    next(error);
  }
};