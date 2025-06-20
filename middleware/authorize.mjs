import GenericException from "../exceptions/GenericException.mjs"; 
export const authorize = (...roles) => {
  return (req, res, next) => {
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