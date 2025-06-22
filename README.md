# Bloggy API

Welcome to the backend API for Bloggy, a modern and feature-rich blogging platform. This server is built with Node.js and Express, providing a robust, secure, and scalable RESTful API to support the [Bloggy Frontend](https://github.com/B-a-d-r-a-n/Bloggy).

The API handles everything from user authentication and profile management to full CRUD operations for articles, nested comments, and more.


---

## ✨ Features

-   **RESTful API Design:** Logical, resource-oriented endpoints for clean and predictable interactions.
-   **Secure JWT Authentication:** A complete authentication system using short-lived access tokens and long-lived, `httpOnly` refresh tokens for secure session management.
-   **Full CRUD Operations:** Comprehensive endpoints for managing Users, Articles, Comments (with nested replies), Tags, and Categories.
-   **Advanced Querying:** The article list endpoint supports dynamic filtering by category and author, as well as full-text search across titles, summaries, and author names.
-   **Reputation System:** Endpoints for "starring" articles, which automatically updates total star counts for authors.
-   **Cloud Image Uploads:** Seamlessly handles file uploads by proxying them directly to **ImgBB** (or Cloudinary), storing only the public URL.
-   **Dynamic Sitemap Generation:** A dedicated `/sitemap.xml` endpoint to improve SEO for the frontend application.
-   **Security & Performance:** Equipped with `helmet` for security headers, `cors` for cross-origin management, and `express-rate-limit` to prevent abuse.

---

## 🚀 Tech Stack

-   **Runtime:** [Node.js](https://nodejs.org/) with ES Modules (`.mjs`)
-   **Framework:** [Express.js](https://expressjs.com/)
-   **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) for elegant object data modeling.
-   **Authentication:** [JSON Web Token (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken) & [cookie-parser](https://github.com/expressjs/cookie-parser)
-   **Image Uploads:** [Multer](https://github.com/expressjs/multer) for processing multipart/form-data and [Axios](https://axios-http.com/) for proxying to ImgBB.
-   **Validation:** [express-validator](https://express-validator.github.io/docs/) for robust request validation.
-   **API Documentation:** [Swagger UI](https://swagger.io/tools/swagger-ui/) via `swagger-ui-express` and `swagger-jsdoc`.
-   **Deployment:** Hosted as a Serverless Function on [Vercel](https://vercel.com/).

---

## 🛠️ Getting Started

Follow these instructions to get the API server running on your local machine for development and testing.

### Prerequisites

-   Node.js (v18 or later recommended)
-   MongoDB (A local instance or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster is required)
-   npm or yarn

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/bloggy-api.git
    cd bloggy-api
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and populate it with the following values. You can generate long, random strings for the JWT secrets.

    ```env
    # Server Configuration
    PORT=3000
    NODE_ENV=development

    # Database Connection String
    MONGODB_URI=your_mongodb_atlas_or_local_connection_string

    # JWT Secrets
    JWT_SECRET=your_super_long_random_jwt_secret
    JWT_EXPIRES_IN=15m
    JWT_REFRESH_SECRET=your_other_super_long_random_refresh_secret
    JWT_REFRESH_EXPIRES_IN=7d
    JWT_COOKIE_EXPIRES_IN=7

    # ImgBB API Key
    IMGBB_API_KEY=your_imgbb_api_key
    ```

### Running the Server

-   **For development (with automatic restarts):**
    ```sh
    npm run dev
    ```

-   **For production:**
    ```sh
    npm start
    ```

-   **To populate the database with fake data:**
    ```sh
    npm run seed
    ```

The API server will be available at `http://localhost:3000`.

---

## 📚 API Documentation

Once the server is running in development mode, you can access the complete, interactive API documentation at:

**[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

This Swagger UI page allows you to explore all available endpoints, see their required parameters and response schemas, and even execute live API calls directly from your browser.

**Live API Docs:** [https://your-api-name.vercel.app/api-docs](https://your-api-name.vercel.app/api-docs)
---
