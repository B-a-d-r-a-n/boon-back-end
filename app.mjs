import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import * as AdminJSExpress from "@adminjs/express";
import bcrypt from "bcrypt";
import connectMongo from "connect-mongo";
import User from "./models/user.model.mjs";
import { customExceptionHandler } from "./middleware/customExceptionHandler.mjs";
import authRouter from "./routes/auth.router.mjs";
import articlesRouter from "./routes/articles.router.mjs";
import userRouter from "./routes/user.router.mjs";
import commentsRouter from "./routes/comments.router.mjs";
import categoryRouter from "./routes/category.router.mjs";
import tagRouter from "./routes/tag.router.mjs";
import sitemapRouter from "./routes/sitemap.router.mjs";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db/config.db.mjs";
import swaggerUi from "swagger-ui-express";
import "./models/user.model.mjs";
import "./models/category.model.mjs";
import "./models/tag.model.mjs";
import "./models/comment.model.mjs";
import "./models/article.model.mjs";
import adminOptions from "./admin/admin.options.mjs";
import AdminJS from "adminjs";
import session from "express-session";
// import swaggerSpec from "./swaggerDef.mjs";

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

const frontendUrl = process.env.FrontEnd_url;

const allowedOrigins = [
  frontendUrl,
  "https://bloggy-api.vercel.app",
  "http://localhost:3000",
];

const MongoStore = connectMongo.create({
  mongoUrl: process.env.MONGODB_URI,
  collectionName: "sessions",
});

app.use(
  session({
    secret:
      process.env.ADMIN_COOKIE_PASSWORD ||
      "a-very-secret-and-long-password-for-sessions",
    store: MongoStore,
    resave: false,
    saveUninitialized: false, // Don't create sessions for unauthenticated users
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("CORS check - Origin:", origin);
      console.log("Origin type:", typeof origin);
      console.log("Allowed origins:", allowedOrigins);

      // Handle null/undefined origin OR string "null"
      if (!origin || origin === "null") {
        console.log("No origin or null origin - allowing request");
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log("Origin allowed:", origin);
        return callback(null, true);
      }

      // If we get here, origin exists but is not allowed
      console.log("Origin rejected:", origin);
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
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

// MIME type middleware
app.use((req, res, next) => {
  // Set proper MIME types for Swagger UI assets
  if (req.path.includes("swagger-ui") && req.path.endsWith(".js")) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  } else if (req.path.includes("swagger-ui") && req.path.endsWith(".css")) {
    res.setHeader("Content-Type", "text/css; charset=utf-8");
  } else if (req.path.includes("api-docs") && req.path.endsWith(".json")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  next();
});

// Swagger docs
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerSpec, {
//     customCss: ".swagger-ui .topbar { display: none }",
//     customSiteTitle: "API Documentation",
//   })
// );

// Serve swagger JSON separately
// app.get("/swagger.json", (req, res) => {
//   res.setHeader("Content-Type", "application/json");
//   res.send(swaggerSpec);
// });

// --- 3. ADMINJS SETUP (Simplified) ---
const admin = new AdminJS(adminOptions);

// Use the simpler `buildRouter` instead of `buildAuthenticatedRouter`.
// It will automatically use the `express-session` middleware we defined above.
const adminRouter = AdminJSExpress.buildRouter(admin);

// Mount the AdminJS router.
app.use(admin.options.rootPath, adminRouter);

// --- LOGIN ROUTE FOR ADMINJS (Separate from your API auth) ---
// We need to create a simple, separate login route for the admin panel.
app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (user && user.role === "admin") {
    const matched = await bcrypt.compare(password, user.password);
    if (matched) {
      // If login is successful, set the user on the session object.
      // AdminJS will check `req.session.adminUser` to see if someone is logged in.
      req.session.adminUser = {
        email: user.email,
        role: user.role,
        // You can add other non-sensitive info here
      };
      // Redirect back to the admin dashboard on successful login
      return res.redirect("/admin");
    }
  }
  // If login fails, redirect back to the login page with an error message
  return res.redirect("/admin/login?error=Invalid%20credentials");
});

// Create a logout route
app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});
// Sitemap router
app.use("/", sitemapRouter);

// API Routers
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/articles", articlesRouter);
app.use("/api/v1/comments", commentsRouter);
app.use("/api/v1/users", userRouter);
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
      console.log(
        `Swagger docs available at: http://localhost:${port}/api-docs`
      );
      console.log(`AdminJS panel available at: http://localhost:${port}/admin`);
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
