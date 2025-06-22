import swaggerJsdoc from "swagger-jsdoc";
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bloggy API",
      version: "1.0.0",
      description:
        "The official API documentation for the Bloggy platform. This API powers a full-featured blogging application with user authentication, articles, nested comments, and more.",
      contact: {
        url: "https://www.linkedin.com/in/mohamed-ahmed-badran/",
        email: "mohamed.ahmed.badran0@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Local Development Server",
      },
      {
        url: "https://bloggy-api.vercel.app/api/v1",
        description: "Production Server (Vercel)",
      },
    ],
    // Defines the security scheme for JWT authentication
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      // Defines reusable data models
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", description: "User ID" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            avatarUrl: { type: "string", format: "uri" },
            totalStars: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Article: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            summary: { type: "string" },
            content: { type: "string", description: "HTML content" },
            coverImageUrl: { type: "string", format: "uri" },
            author: { $ref: "#/components/schemas/User" },
            category: {
              type: "object",
              properties: { _id: { type: "string" }, name: { type: "string" } },
            },
            tags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
            starsCount: { type: "integer" },
            totalCommentCount: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            text: { type: "string" },
            author: { $ref: "#/components/schemas/User" },
            replies: {
              type: "array",
              items: { $ref: "#/components/schemas/Comment" },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  // Point to the files where your routes are defined
  apis: ["./routes/**/*.mjs"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
