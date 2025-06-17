import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";

// Import all your Mongoose models
import User from "./models/user.model.mjs";
import Category from "./models/category.model.mjs";
import Tag from "./models/tag.model.mjs";
import Article from "./models/article.model.mjs";
import Comment from "./models/comment.model.mjs";

// Load environment variables
dotenv.config();

// --- Configuration ---
const NUM_USERS = 10;
const NUM_CATEGORIES = 5;
const NUM_TAGS = 15;
const NUM_ARTICLES = 50;
const COMMENTS_PER_ARTICLE = 8; // Average number of comments
const REPLIES_PER_COMMENT = 2; // Average number of replies

// --- Helper Function to pick a random item from an array ---
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected for seeding...");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // --- 1. Clean the Database ---
    console.log("Cleaning old data...");
    await User.deleteMany({});
    await Category.deleteMany({});
    await Tag.deleteMany({});
    await Article.deleteMany({});
    await Comment.deleteMany({});

    // --- 2. Create Users ---
    // console.log(`Creating ${NUM_USERS} users...`);
    // const users = [];
    // for (let i = 0; i < NUM_USERS; i++) {
    //   users.push(
    //     await User.create({
    //       name: faker.person.fullName(),
    //       email: faker.internet.email().toLowerCase(),
    //       password: "password123", // Use a simple password for all fake users
    //       passwordConfirm: "password123",
    //       avatarUrl: faker.image.avatar(),
    //     })
    //   );
    // }

    // --- 3. Create Categories ---
    console.log(`Creating ${NUM_CATEGORIES} categories...`);
    const categories = [];
    const categoryNames = [
      "Technology",
      "Lifestyle",
      "Business",
      "Science",
      "Travel",
    ];
    for (const name of categoryNames) {
      categories.push(await Category.create({ name }));
    }

    // --- 4. Create Tags ---
    console.log(`Creating ${NUM_TAGS} tags...`);
    const tags = [];
    const tagNames = new Set(); // Use a Set to ensure unique tag names
    while (tagNames.size < NUM_TAGS) {
      tagNames.add(faker.word.adjective());
    }
    for (const name of tagNames) {
      tags.push(await Tag.create({ name }));
    }

    // // --- 5. Create Articles ---
    // console.log(`Creating ${NUM_ARTICLES} articles...`);
    // const articles = [];
    // for (let i = 0; i < NUM_ARTICLES; i++) {
    //   const title = faker.lorem.sentence({ min: 5, max: 10 });
    //   const content = `<p>${faker.lorem.paragraphs(
    //     { min: 10, max: 20 },
    //     "</p><p>"
    //   )}</p>`;

    //   // Select a random subset of tags for each article
    //   const articleTags = faker.helpers
    //     .arrayElements(tags, { min: 2, max: 5 })
    //     .map((t) => t._id);

    //   articles.push(
    //     await Article.create({
    //       title,
    //       summary: faker.lorem.paragraph(),
    //       content,
    //       coverImageUrl: faker.image.urlLoremFlickr({
    //         category: "nature,technology,city",
    //       }),
    //       author: getRandomItem(users)._id,
    //       category: getRandomItem(categories)._id,
    //       tags: articleTags,
    //       readTimeInMinutes: Math.ceil(content.length / 1200), // Simple read time calculation
    //     })
    //   );
    // }

    // // --- 6. Create Comments and Replies ---
    // console.log("Creating comments and replies...");
    // for (const article of articles) {
    //   let topLevelComments = [];
    //   const numComments = faker.number.int({
    //     min: 2,
    //     max: COMMENTS_PER_ARTICLE,
    //   });

    //   for (let i = 0; i < numComments; i++) {
    //     const comment = await Comment.create({
    //       text: faker.lorem.sentence(),
    //       author: getRandomItem(users)._id,
    //       article: article._id,
    //     });
    //     topLevelComments.push(comment);

    //     // Create some replies for this comment
    //     const numReplies = faker.number.int({
    //       min: 0,
    //       max: REPLIES_PER_COMMENT,
    //     });
    //     for (let j = 0; j < numReplies; j++) {
    //       const reply = await Comment.create({
    //         text: faker.lorem.sentence({ min: 3, max: 8 }),
    //         author: getRandomItem(users)._id,
    //         article: article._id,
    //       });
    //       // Add the reply's ID to the parent comment's replies array
    //       comment.replies.push(reply._id);
    //     }
    //     await comment.save();
    //   }
    //   // Add the top-level comments to the article
    //   article.comments = topLevelComments.map((c) => c._id);
    //   await article.save();
    // }

    console.log("✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    // --- 7. Disconnect from Database ---
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

seedDatabase();
