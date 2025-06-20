import authService from "../services/auth.service.mjs";
import User from "../models/user.model.mjs"; 
import GenericException from "../exceptions/GenericException.mjs";
const sendTokenResponse = (
  user,
  accessToken,
  refreshToken,
  statusCode,
  res
) => {
  const userOutput = { ...user.toObject() };
  delete userOutput.password;
  delete userOutput.passwordChangedAt;
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", 
  };
  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    accessToken,
    data: {
      user: userOutput,
    },
  });
};
export const register = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm } = req.body; 
    const newUser = await authService.registerUser({
      name,
      email,
      password,
      passwordConfirm,
    }); 
    const accessToken = authService.createAccessToken(newUser);
    const refreshToken = authService.createRefreshToken(newUser);
    sendTokenResponse(newUser, accessToken, refreshToken, 201, res);
  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser(
      email,
      password
    );
    sendTokenResponse(user, accessToken, refreshToken, 200, res);
  } catch (error) {
    next(error);
  }
};
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
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
export const refreshToken = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
      return next(
        new GenericException(
          401,
          "Refresh token not found. Please log in again."
        )
      );
    }
    const user = await authService.verifyRefreshToken(incomingRefreshToken);
    const newAccessToken = authService.createAccessToken(user);
    const newRefreshToken = authService.createRefreshToken(user);
    sendTokenResponse(user, newAccessToken, newRefreshToken, 200, res);
  } catch (error) {
    next(error);
  }
};
export const logout = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (incomingRefreshToken && req.user) {
      const user = await User.findById(req.user.id);
      if (user && user.refreshToken === incomingRefreshToken) {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }
    res.cookie("refreshToken", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000), 
      httpOnly: true,
    });
    res
      .status(200)
      .json({ status: "success", message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};