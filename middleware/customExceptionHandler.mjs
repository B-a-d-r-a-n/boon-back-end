export function customExceptionHandler(err, req, res, next) {
  const error = err || new Error("An unknown error occurred.");
  const status = error.status || 500;
  const message = error.message || "Internal Server Error";
  console.error("ERROR HANDLED:", {
    status,
    message,
    stack: error.stack, 
  });
  res.status(status).json({
    status: "error", 
    message: message,
  });
}