import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { customExceptionHandler } from "./middleware/customExceptionHandler.mjs";
import authRouter from "./routes/auth.router.mjs";
import userRouter from "./routes/user.router.mjs";
import brandsRouter from "./routes/brands.router.mjs";
import categoryRouter from "./routes/category.router.mjs";
import deliveryRouter from "./routes/delivery.router.mjs";
import commercialRouter from "./routes/commercial.router.mjs";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db/config.db.mjs";
import "./models/user.model.mjs";
import "./models/category.model.mjs";
import orderRouter from "./routes/orders.router.mjs";
import productRouter from "./routes/products.router.mjs";
import "./models/product.model.mjs";
import "./models/order.model.mjs";
const app = express();
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Blocked, try again after 15 minutes",
});
const frontendUrl = process.env.FrontEnd_url;
const allowedOrigins = [frontendUrl];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === "null") {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("Origin rejected:", origin);
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://i.ibb.co",
        ],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
  })
);
app.use(limiter);
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((req, res, next) => {
  if (req.path.includes("swagger-ui") && req.path.endsWith(".js")) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  } else if (req.path.includes("swagger-ui") && req.path.endsWith(".css")) {
    res.setHeader("Content-Type", "text/css; charset=utf-8");
  } else if (req.path.includes("api-docs") && req.path.endsWith(".json")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  next();
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/brands", brandsRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/delivery-methods", deliveryRouter);
app.use("/api/v1/commercials", commercialRouter);
app.get("/health", (req, res) => res.status(200).send("OK"));
app.use(customExceptionHandler);
connectDB()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(
        `Server running on port ${port} in ${process.env.NODE_ENV} mode`
      );
      console.log(
        `Swagger docs available at: http://localhost:${port}/api-docs`
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
