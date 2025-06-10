// dev-data/seeder.mjs
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs"; // Needed to manually hash passwords for seeding

// Import all your models
import User from "../models/user.model.mjs";
import Category from "../models/category.model.mjs";
import Tag from "../models/tag.model.mjs";
import Article from "../models/article.model.mjs";
import Comment from "../models/comment.model.mjs";

// Load environment variables (e.g., from a .env file)
dotenv.config({ path: "./.env" });

// --- DATABASE CONNECTION ---
// Replace with your MongoDB connection string
const DB = process.env.MONGODB_URI || "mongodb://localhost:27017/bloggy-db";

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

// --- DELETE ALL EXISTING DATA ---
const deleteAllData = async () => {
  try {
    console.log("--- DELETING ALL DATA ---");
    // Delete in reverse order of dependency
    await Comment.deleteMany();
    await Article.deleteMany();
    await Tag.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    console.log("All data successfully deleted!");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

// --- IMPORT DATA ---
const importData = async () => {
  try {
    console.log("--- SEEDING DATABASE ---");

    // 1. Create Users
    const usersData = [
      {
        name: "Alex Johnson",
        email: "alex@example.com",
        password: "password123",
        role: "admin",
      },
      {
        name: "Samantha Lee",
        email: "samantha@example.com",
        password: "password123",
      },
      {
        name: "Maria Garcia",
        email: "maria@example.com",
        password: "password123",
      },
      {
        name: "David Chen",
        email: "david@example.com",
        password: "password123",
      },
    ];
    // Manually hash passwords because the 'save' hook isn't run on create()
    for (const user of usersData) {
      user.password = await bcrypt.hash(user.password, 12);
    }
    const createdUsers = await User.create(usersData);
    console.log("Users created...");

    // 2. Create Categories & Tags
    const categoriesData = [
      { name: "Technology" },
      { name: "Web Design" },
      { name: "Security" },
      { name: "Lifestyle" },
      { name: "Travel" },
    ];
    const tagsData = [
      { name: "react" },
      { name: "tiptap" },
      { name: "tailwind" },
      { name: "nodejs" },
    ];
    const createdCategories = await Category.create(categoriesData);
    const createdTags = await Tag.create(tagsData);
    console.log("Categories & Tags created...");

    // 3. Create Articles
    const articlesData = [
      {
        title: "Mastering Modern React with TanStack",
        summary: "A deep dive into TanStack...",
        content: "<h2>Full Content Here</h2><p>This is the full text...</p>",
        author: createdUsers[0]._id,
        category: createdCategories[0]._id,
        tags: [createdTags[0]._id, createdTags[2]._id],
      },
      {
        title: "The Art of Headless UI Components",
        summary: "Learn how to build truly reusable UI...",
        content: "<h2>Headless UI Intro</h2><p>...</p>",
        author: createdUsers[1]._id,
        category: createdCategories[1]._id,
        tags: [createdTags[1]._id, createdTags[2]._id],
      },
      {
        title: "Top 10 Fall Recipes for a Cozy Evening",
        summary: "From pumpkin spice lattes to hearty stews...",
        content: "<h2>Recipe 1: Pumpkin Soup</h2><p>...</p>",
        author: createdUsers[2]._id,
        category: createdCategories[3]._id,
        tags: [],
      },
      {
        title: "Weekend Travel Guide: The Mountain Trail",
        summary: "Discover the best hiking trails...",
        content: "<h2>Day 1: The Ascent</h2><p>...</p>",
        author: createdUsers[3]._id,
        category: createdCategories[4]._id,
        tags: [],
      },
    ];
    const createdArticles = await Article.create(articlesData);
    console.log("Articles created...");

    // 4. Create Comments & Replies
    const comment1 = await Comment.create({
      text: "Great article, very helpful!",
      author: createdUsers[1]._id,
      article: createdArticles[0]._id,
    });
    const comment2 = await Comment.create({
      text: "Thanks for sharing!",
      author: createdUsers[2]._id,
      article: createdArticles[0]._id,
    });
    const reply1 = await Comment.create({
      text: "You're welcome!",
      author: createdUsers[0]._id,
      article: createdArticles[0]._id,
    });

    // Link the reply to its parent comment
    await Comment.findByIdAndUpdate(comment2._id, {
      $push: { replies: reply1._id },
    });

    // Link the top-level comments to the article
    await Article.findByIdAndUpdate(createdArticles[0]._id, {
      $set: { comments: [comment1._id, comment2._id] },
    });
    console.log("Comments & Replies created...");

    console.log("Data successfully loaded!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// --- SCRIPT EXECUTION LOGIC ---
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteAllData();
} else {
  console.log("Please specify an action: --import or --delete");
  process.exit();
}
