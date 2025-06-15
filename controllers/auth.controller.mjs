// controllers/auth.controller.mjs
import authService from "../services/auth.service.mjs";
import User from "../models/user.model.mjs"; // For potentially fetching user data
import GenericException from "../exceptions/GenericException.mjs";

const sendTokenResponse = (
  user,
  accessToken,
  refreshToken,
  statusCode,
  res
) => {
  // must remove password from output
  const userOutput = { ...user.toObject() };
  delete userOutput.password;
  delete userOutput.passwordChangedAt;
  // delete userOutput.refreshToken; // if you stored it and don't want to send

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // more security
    secure: process.env.NODE_ENV === "production", //protocol = https
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
    const { name, email, password, passwordConfirm } = req.body; // Allow role for seeding admin
    const newUser = await authService.registerUser({
      name,
      email,
      password,
      passwordConfirm,
    }); //add user role if needed

    // For registration, you might just send a success message or automatically log them in
    // Here, we'll automatically log them in by creating tokens
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

export const refreshToken = async (req, res, next) => {
  try {
    // 1. Get the token from the cookie. This is the controller's job.
    const incomingRefreshToken = req.cookies.refreshToken;

    // 2. If no token is found, pass a specific 401 error to the error handler.
    if (!incomingRefreshToken) {
      return next(
        new GenericException(
          401,
          "Refresh token not found. Please log in again."
        )
      );
    }

    // 3. Call the clean service method with just the token string.
    const user = await authService.verifyRefreshToken(incomingRefreshToken);

    // 4. If the service returns a user, create new tokens.
    const newAccessToken = authService.createAccessToken(user);
    const newRefreshToken = authService.createRefreshToken(user);

    // 5. Send the successful response.
    sendTokenResponse(user, newAccessToken, newRefreshToken, 200, res);
  } catch (error) {
    // 6. If authService.verifyRefreshToken throws ANY error, it will be caught here
    //    and passed to the global error handler. This is correct!
    next(error);
  }
};
export const logout = async (req, res, next) => {
  try {
    // To properly logout with JWTs, the client needs to discard the token.
    // For refresh tokens stored in cookies, we can clear the cookie.
    // If refresh tokens are stored in the DB, invalidate it there.
    // For this example, we clear the cookie.

    // Optional: Invalidate the refresh token on the server if stored
    const incomingRefreshToken = req.cookies.refreshToken;
    if (incomingRefreshToken && req.user) {
      // Assuming authenticate middleware runs before and attaches req.user
      const user = await User.findById(req.user.id);
      if (user && user.refreshToken === incomingRefreshToken) {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }

    res.cookie("refreshToken", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000), // Expires quickly
      httpOnly: true,
    });
    res
      .status(200)
      .json({ status: "success", message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
