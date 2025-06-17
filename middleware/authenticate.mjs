// middleware/authenticate.mjs
import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs";
import GenericException from "../exceptions/GenericException.mjs"; // Or UnauthorizedException

export const authenticate = async (req, res, next) => {
  try {
    let token;
    // 1) Getting token and check if it's there
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      // Alternative: check for token in cookie
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new GenericException(
          401,
          "You are not logged in! Please log in to get access."
        )
      );
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Promisify or handle callback if not using sync

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new GenericException(
          401,
          "The user belonging to this token does no longer exist."
        )
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new GenericException(
          401,
          "User recently changed password! Please log in again."
        )
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser; // Attach user to the request object
    res.locals.user = currentUser; // Also make available in templates if using SSR
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return next(
        new GenericException(401, "Invalid token. Please log in again!")
      );
    }
    if (err.name === "TokenExpiredError") {
      return next(
        new GenericException(
          401,
          "Your token has expired! Please log in again."
        )
      );
    }
    next(new GenericException(401, "Authentication failed. Please log in."));
  }
};
