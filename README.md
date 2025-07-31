
# Boon-Commerce API

Boon-Commerce is a robust and feature-rich RESTful API for an e-commerce platform. Built with Node.js, Express, and MongoDB, it provides a complete backend solution for managing products, users, orders, authentication, and more. It's designed to be scalable, secure, and easy to integrate with any front-end application.

## ✨ Features

*   **Full E-commerce Functionality**: Manage products, categories, brands, and promotional content.
*   **Complete User Module**: User registration, profile management, and role-based access control.
*   **Secure Authentication**: JWT-based authentication with support for both standard credentials and OAuth (Google, Facebook).
*   **Role-Based Authorization**: Differentiated permissions for customers, sellers, and administrators.
*   **Advanced Product Filtering & Search**:
    *   Full-text search across product names and descriptions.
    *   Dynamic filtering by category, brand, and price range.
    *   Sorting by various attributes (e.g., creation date, price).
    *   Pagination for handling large datasets efficiently.
*   **User Shopping Features**:
    *   Persistent Shopping Cart management.
    *   Personal Wishlist functionality.
*   **Order Processing**: A complete workflow for creating and managing customer orders, which automatically updates product stock.
*   **Product Reviews**: Authenticated users can leave ratings and comments on products.
*   **Image Handling**: Utilizes Multer for handling file uploads and integrates with the ImgBB API for external image hosting.
*   **Database Seeding**: A convenient script to populate the database with initial sample data for products, categories, and more.
*   **Security & Performance**:
    *   `helmet` for securing HTTP headers.
    *   `express-rate-limit` to prevent brute-force attacks.
    *   `cors` for controlled cross-origin access.

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB with Mongoose ODM
*   **Authentication**: JSON Web Tokens (jsonwebtoken), bcrypt.js
*   **File Uploads**: Multer, ImgBB API (via Axios)
*   **Middleware**: CORS, Helmet, Morgan, Express Rate Limit
*   **Environment**: dotenv

---

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm
*   MongoDB (either a local instance or a cloud-based one like MongoDB Atlas)

### 1. Installation

Clone the repository to your local machine:
```bash
git clone <your-repository-url>
cd <repository-folder>
```

Install the required npm packages:
```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root of the project. This file will store your environment variables. Copy the contents of the example below and replace the placeholder values with your actual credentials.

**.env.example**
```env
# Server Configuration
NODE_ENV="Development"
PORT=3500
FrontEnd_url=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

# JWT Secrets & Expiration
JWT_SECRET=<your-very-long-and-secure-jwt-secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<your-very-long-and-secure-jwt-refresh-secret>
JWT_REFRESH_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# External API Keys
IMGBB_API_KEY=<your-imgbb-api-key>
```

### 3. Database Seeding

The project includes a seeder script to populate your database with initial data from the `/data` directory.

**Important**: The seeder requires at least one 'admin' user to exist in the database to assign products to. You may need to register an admin user manually first before seeding products.

To import all data (this will delete existing data in the collections):
```bash
npm run seed -- --import
```
To delete all data from the relevant collections:
```bash
npm run seed -- --delete
```

### 4. Running the Application

To start the server in development mode with live-reloading (using nodemon):
```bash
npm run dev
```
To start the server in production mode:
```bash
npm start
```The API will be available at `http://localhost:3500` (or the port you specified).

---

##  API Endpoints

The API routes are versioned under `/api/v1`.

| Route                    | Method | Description                                       | Authentication |
| ------------------------ | ------ | ------------------------------------------------- | -------------- |
| `/auth/register`         | `POST` | Register a new user.                              | Public         |
| `/auth/login`            | `POST` | Log in with email and password.                   | Public         |
| `/auth/oauth`            | `POST` | Log in or register via OAuth (Google/Facebook).   | Public         |
| `/auth/me`               | `GET`  | Get the current authenticated user's profile.     | Authenticated  |
| `/users/me`              | `PATCH`| Update the current user's profile information.    | Authenticated  |
| `/users/me/avatar`       | `PATCH`| Update the current user's profile picture.        | Authenticated  |
| `/users/wishlist`        | `GET`  | Get the user's wishlist.                          | Authenticated  |
| `/users/wishlist`        | `POST` | Add/remove a product from the wishlist.           | Authenticated  |
| `/users/cart`            | `GET`  | Get the user's shopping cart.                     | Authenticated  |
| `/users/cart`            | `POST` | Add an item to the cart.                          | Authenticated  |
| `/users/cart`            | `DELETE`| Clear the entire shopping cart.                   | Authenticated  |
| `/products`              | `GET`  | Get all products with filtering, sorting, etc.    | Public         |
| `/products`              | `POST` | Add a new product.                                | Admin          |
| `/products/:slug`        | `GET`  | Get a single product by its slug.                 | Public         |
| `/products/:id`          | `PATCH`| Update an existing product.                       | Admin          |
| `/products/:id/reviews`  | `POST` | Add a review to a product.                        | Authenticated  |
| `/orders`                | `POST` | Create a new order from the user's cart.          | Authenticated  |
| `/orders/myorders`       | `GET`  | Get all orders for the current user.              | Authenticated  |
| `/orders/:id`            | `GET`  | Get a specific order by ID.                       | Authenticated  |
| `/categories`            | `GET`  | Get all product categories.                       | Public         |
| `/brands`                | `GET`  | Get all product brands.                           | Public         |
| `/commercials`           | `GET`  | Get commercial/promotional banner data.           | Public         |
| `/delivery-methods`      | `GET`  | Get available delivery methods and prices.        | Public         |
