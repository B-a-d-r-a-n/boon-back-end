import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { customExceptionHandler } from "./middleware/customExceptionHandler.mjs";

import authRouter from "./routes/auth.router.mjs";
import articlesRouter from "./routes/articles.router.mjs";
import userRouter from "./routes/user.router.mjs";
import commentsRouter from "./routes/comments.router.mjs";
import categoryRouter from "./routes/category.router.mjs";
import tagRouter from "./routes/tag.router.mjs";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db/config.db.mjs";
// import { requestLogger } from "./middleware/requestLogger.mjs"; // if you use it
import "./models/user.model.mjs";
import "./models/category.model.mjs";
import "./models/tag.model.mjs";
import "./models/comment.model.mjs";
import "./models/article.model.mjs";

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;

//limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Blocked, try again after 15 minutes",
});

//cors policy
const allowedOrigins = [
  "http://localhost:5173", // Your Vite dev server
  // Add your production frontend URL here when you deploy
  // 'https://www.your-production-site.com',
];

// --- 2. Configure Helmet ---
// Helmet should come first to set security headers.
app.use(
  helmet({
    // This is the modern replacement for setting CORP headers manually.
    // It tells browsers that resources from this origin can be embedded on other pages.
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // We can let the `cors` package handle the `Origin` header.
    // Setting this to false prevents conflicts between Helmet and cors.
    crossOriginOpenerPolicy: false,
  })
);

// --- 3. Configure CORS using the modern function-based origin ---
// This is the most robust way to handle multiple origins and credentials.
app.use(
  cors({
    origin: (origin, callback) => {
      // The `origin` argument will be the URL of your frontend.
      // Allow requests with no origin (like Postman, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      // Check if the incoming origin is in our list of allowed origins.
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }

      // If the origin is allowed, pass `null` for the error and `true` for success.
      return callback(null, true);
    },
    credentials: true, // This is essential for sending cookies (for your httpOnly refresh token)
  })
);

app.use(limiter);
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routers

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/articles", articlesRouter);
app.use("/api/v1/comments", commentsRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/tags", tagRouter);
// Health check
app.get("/health", (req, res) => res.status(200).send("OK"));

// Exceptions middleware
app.use(customExceptionHandler);

connectDB()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(
        `Server running on port ${port} in ${process.env.NODE_ENV} mode`
      );
    });
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down.");
      server.close(() => {
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

process.on("uncaughtException", (err) => {
  console.error("unhandled exceptions", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("unhandled promise rejection", err);
  process.exit(1);
});
