import AdminJS from "adminjs";
import * as AdminJSMongoose from "@adminjs/mongoose";
import User from "../models/user.model.mjs"; // Add this missing import
import Comment from "../models/comment.model.mjs";
import Article from "../models/article.model.mjs";
import Category from "../models/category.model.mjs";
import Tag from "../models/tag.model.mjs";

// Tell AdminJS to use the Mongoose adapter
AdminJS.registerAdapter({
  Database: AdminJSMongoose.Database,
  Resource: AdminJSMongoose.Resource,
});

/**
 * @type {import('adminjs').AdminJSOptions}
 */
const adminOptions = {
  // We will define our database resources here
  resources: [
    // Each model gets its own configuration object
    {
      resource: User,
      options: {
        // Customize how the User resource is displayed
        listProperties: [
          "name",
          "email",
          "role",
          "authorStatus",
          "totalStars",
          "createdAt",
        ],
        editProperties: ["name", "email", "role", "authorStatus"], // Fields admins can edit
        showProperties: [
          "_id",
          "name",
          "email",
          "role",
          "authorStatus",
          "totalStars",
          "address",
          "createdAt",
          "updatedAt",
          "authorApplicationMessage",
        ],
        // Custom action to approve an author
        actions: {
          approveAuthor: {
            actionType: "record",
            icon: "Checkmark",
            guard: "Are you sure you want to approve this user as an author?",
            component: false, // No custom component needed
            handler: async (request, response, context) => {
              const { record, currentAdmin } = context;
              await record.update({ authorStatus: "approved", role: "author" });
              return {
                record: record.toJSON(currentAdmin),
                notice: {
                  message: `User ${record.param(
                    "name"
                  )} has been approved as an author.`,
                  type: "success",
                },
              };
            },
            // Only show this button for users with 'pending' status
            isVisible: (context) =>
              context.record.param("authorStatus") === "pending",
          },
        },
      },
    },
    { resource: Article },
    { resource: Comment },
    { resource: Category },
    { resource: Tag },
  ],
  // You can customize the branding
  branding: {
    companyName: "Bloggy Admin",
    softwareBrothers: false, // Removes the "Made by Software Brothers" text
  },
  // Set the default language
  locale: {
    translations: {
      labels: {
        // You can rename models here for a friendlier display
        User: "Users & Authors",
        Article: "Blog Posts",
      },
    },
  },
  // The path to your admin panel
  rootPath: "/admin",
};

export default adminOptions;
