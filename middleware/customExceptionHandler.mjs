export function customExceptionHandler(err, req, res, next) {
  // --- ROBUSTNESS FIX ---
  // If `err` is somehow undefined or falsy, create a default error.
  const error = err || new Error("An unknown error occurred.");

  // Now, use the `error` object, which is guaranteed to exist.
  const status = error.status || 500;
  const message = error.message || "Internal Server Error";

  // Also, log the actual error on the server for debugging purposes!
  // This is very important for production.
  console.error("ERROR HANDLED:", {
    status,
    message,
    stack: error.stack, // Log the stack trace
  });

  res.status(status).json({
    status: "error", // It's good practice to have a status string
    message: message,
  });
}
