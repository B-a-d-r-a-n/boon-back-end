import AdminJS from "adminjs";
import * as AdminJSMongoose from "@adminjs/mongoose";
import User from "../models/user.model.mjs"; 
import Comment from "../models/comment.model.mjs";
import Article from "../models/article.model.mjs";
import Category from "../models/category.model.mjs";
import Tag from "../models/tag.model.mjs";
AdminJS.registerAdapter({
  Database: AdminJSMongoose.Database,
  Resource: AdminJSMongoose.Resource,
});
const adminOptions = {
  resources: [
    {
      resource: User,
      options: {
        listProperties: [
          "name",
          "email",
          "role",
          "authorStatus",
          "totalStars",
          "createdAt",
        ],
        editProperties: ["name", "email", "role", "authorStatus"], 
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
        actions: {
          approveAuthor: {
            actionType: "record",
            icon: "Checkmark",
            guard: "Are you sure you want to approve this user as an author?",
            component: false, 
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
  branding: {
    companyName: "Bloggy Admin",
    softwareBrothers: false, 
  },
  locale: {
    translations: {
      labels: {
        User: "Users & Authors",
        Article: "Blog Posts",
      },
    },
  },
  rootPath: "/admin",
};
export default adminOptions;