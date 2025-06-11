// dev-data/seeder.mjs
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { Faker, en } from "@faker-js/faker";

// Import all your models
import User from "../models/user.model.mjs";
import Category from "../models/category.model.mjs";
import Tag from "../models/tag.model.mjs";
import Article from "../models/article.model.mjs";
import Comment from "../models/comment.model.mjs";

// Initialize Faker
const faker = new Faker({ locale: [en] });

// Load environment variables
dotenv.config({ path: "./.env" });

// --- DATABASE CONNECTION ---
const DB = process.env.MONGODB_URI || "mongodb://localhost:27017/bloggy-db";

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

// --- HELPER FUNCTIONS ---
const createUsers = async () => {
  console.log("Creating users...");
  const usersData = [
    {
      name: "Alice Admin",
      email: "alice@example.com",
      password: "password123",
      role: "admin",
      avatarUrl: "uploads/avatars/avatar1.png",
    },
    {
      name: "Bob Blogger",
      email: "bob@example.com",
      password: "password123",
      avatarUrl: "uploads/avatars/avatar2.png",
    },
    {
      name: "Charlie Commenter",
      email: "charlie@example.com",
      password: "password123",
    },
    {
      name: "Diana Dev",
      email: "diana@example.com",
      password: "password123",
      avatarUrl: "uploads/avatars/avatar3.png",
    },
    { name: "Eve Editor", email: "eve@example.com", password: "password123" },
  ];

  for (const user of usersData) {
    user.password = await bcrypt.hash(user.password, 12);
  }
  return User.create(usersData);
};

const createCategoriesAndTags = async () => {
  console.log("Creating categories and tags...");
  const categoriesData = [
    { name: "Technology" },
    { name: "Health & Wellness" },
    { name: "Business" },
    { name: "Travel" },
    { name: "Food" },
  ];
  const tagsData = [
    { name: "react" },
    { name: "nodejs" },
    { name: "productivity" },
    { name: "ai" },
    { name: "cooking" },
  ];

  const categories = await Category.create(categoriesData);
  const tags = await Tag.create(tagsData);
  return { categories, tags };
};

const createArticles = async (users, categories, tags) => {
  console.log("Creating articles...");
  const articlesData = [];
  for (let i = 0; i < 25; i++) {
    const randomUser =
      users[faker.number.int({ min: 0, max: users.length - 1 })];
    const randomCategory =
      categories[faker.number.int({ min: 0, max: categories.length - 1 })];
    const randomTags = faker.helpers
      .arrayElements(tags, faker.number.int({ min: 0, max: 3 }))
      .map((t) => t._id);
    const paragraphCount = faker.number.int({ min: 3, max: 40 }); // from short blogs to long essays
    const content = `<h2>${faker.lorem.words({
      min: 3,
      max: 7,
    })}</h2><p>${faker.lorem.paragraphs(paragraphCount, "\n\n</p><p>")}</p>`;
    // Re-use our calculation logic for realistic seed data
    const text = content.replace(/<[^>]+>/g, "");
    const wordCount = text.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 225));
    articlesData.push({
      title: faker.lorem.sentence({ min: 5, max: 10 }),
      summary: faker.lorem.paragraph({ min: 2, max: 4 }),
      content: content,
      readTimeInMinutes: readTime,
      author: randomUser._id,
      category: randomCategory._id,
      tags: randomTags,
      coverImageUrl:
        i % 3 !== 0
          ? faker.image.urlLoremFlickr({ category: "abstract" })
          : undefined,
    });
  }
  return Article.create(articlesData);
};

const createCommentsAndReplies = async (users, articles) => {
  console.log("Creating comments and replies...");
  for (const article of articles) {
    // Create 0 to 5 top-level comments for each article
    for (let i = 0; i < faker.number.int({ min: 0, max: 5 }); i++) {
      const randomUser =
        users[faker.number.int({ min: 0, max: users.length - 1 })];
      const topLevelComment = await Comment.create({
        text: faker.lorem.sentence(),
        author: randomUser._id,
        article: article._id,
      });
      // Link comment to article
      await Article.findByIdAndUpdate(article._id, {
        $push: { comments: topLevelComment._id },
      });

      // Create 0 to 2 replies for some comments
      if (faker.datatype.boolean()) {
        for (let j = 0; j < faker.number.int({ min: 0, max: 2 }); j++) {
          const randomReplyUser =
            users[faker.number.int({ min: 0, max: users.length - 1 })];
          const reply = await Comment.create({
            text: faker.lorem.sentence({ min: 3, max: 8 }),
            author: randomReplyUser._id,
            article: article._id,
          });
          // Link reply to its parent comment
          await Comment.findByIdAndUpdate(topLevelComment._id, {
            $push: { replies: reply._id },
          });
        }
      }
    }
  }
};

// --- MAIN SEEDING FUNCTIONS ---
const importData = async () => {
  try {
    await deleteAllData(); // Start fresh

    const users = await createUsers();
    const { categories, tags } = await createCategoriesAndTags();
    const articles = await createArticles(users, categories, tags);
    await createCommentsAndReplies(users, articles);

    console.log("\n✅✅✅ Data successfully loaded! ✅✅✅");
  } catch (err) {
    console.error("❌❌❌ ERROR SEEDING DATA ❌❌❌");
    console.error(err);
  } finally {
    console.log("--- Disconnecting from DB ---");
    mongoose.connection.close();
  }
};

const deleteAllData = async () => {
  try {
    console.log("--- DELETING ALL DATA ---");
    await Comment.deleteMany();
    await Article.deleteMany();
    await Tag.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    console.log("--- All data successfully deleted! ---");
  } catch (err) {
    console.error("❌❌❌ ERROR DELETING DATA ❌❌❌");
    console.error(err);
    process.exit(1); // Exit if delete fails
  }
};

// --- SCRIPT EXECUTION LOGIC ---
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteAllData().then(() => mongoose.connection.close());
} else {
  console.log("Please specify an action:");
  console.log(
    "  npm run seed:import   (Deletes all data and imports new data)"
  );
  console.log("  npm run seed:delete   (Deletes all data)");
  process.exit();
}
