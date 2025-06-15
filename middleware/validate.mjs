import { validationResult } from "express-validator";
import GenericException from "../exceptions/GenericException.mjs";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    throw new GenericException(400, errorMessages);
  }
  next();
};
export default validate;
