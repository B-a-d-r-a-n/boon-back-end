// middleware/authorize.mjs
import GenericException from "../exceptions/GenericException.mjs"; // Or ForbiddenException

export const authorize = (...roles) => {
  return (req, res, next) => {
    // roles is an array like ['admin', 'lead-guide']
    // req.user is attached by the 'authenticate' middleware
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new GenericException(
          403,
          "You do not have permission to perform this action."
        )
      );
    }
    next();
  };
};
