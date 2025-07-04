import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import slugify from "slugify";
dotenv.config();
import Product from "./models/product.model.mjs";
import Category from "./models/category.model.mjs";
import Brand from "./models/brand.model.mjs";
import DeliveryMethod from "./models/deliveryMethod.model.mjs";
import User from "./models/user.model.mjs";
import Commercial from "./models/commercial.model.mjs";
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connection successful."))
  .catch((err) => console.error("MongoDB connection error:", err));
const products = JSON.parse(fs.readFileSync("./data/products.json", "utf-8"));
const categories = JSON.parse(
  fs.readFileSync("./data/categories.json", "utf-8")
);
const brands = JSON.parse(fs.readFileSync("./data/brands.json", "utf-8"));
const deliveryMethods = JSON.parse(
  fs.readFileSync("./data/delivery.json", "utf-8")
);
const commercials = JSON.parse(
  fs.readFileSync("./data/commercials.json", "utf-8")
);
const importData = async () => {
  try {
    console.log("--- Deleting existing data... ---");
    await Product.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();
    await DeliveryMethod.deleteMany();
    await Commercial.deleteMany();
    console.log("Old data deleted successfully.");
    console.log("--- Seeding Categories and Brands... ---");
    const categoriesToCreate = categories.map((cat) => ({
      name: cat.Name,
      image: cat.image,
    }));
    const brandsToCreate = brands.map((brand) => ({
      name: brand.Name,
      image: brand.image,
    }));
    const createdCategories = await Category.create(categoriesToCreate);
    const createdBrands = await Brand.create(brandsToCreate);
    console.log("Categories and Brands seeded.");
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      throw new Error(
        "No admin user found. Please create an admin user before seeding products."
      );
    }
    console.log(`Products will be assigned to admin user: ${adminUser.email}`);
    console.log("--- Preparing products with correct references... ---");
    const productsToCreate = products.map((product) => {
      const categoryId = createdCategories[product.CategoryId - 1]._id;
      const brandId = createdBrands[product.BrandId - 1]._id;
      return {
        name: product.Name,
        slug: slugify(product.Name, { lower: true, strict: true }),
        description: product.Description,
        price: product.Price,
        images: [product.PictureUrl], 
        category: categoryId,
        brand: brandId,
        user: adminUser._id, 
        stockCount: Math.floor(Math.random() * 100) + 10, 
        isFeatured: Math.random() < 0.2, 
      };
    });
    console.log("--- Seeding Products and Delivery Methods... ---");
    await Product.create(productsToCreate);
    const deliveryMethodsToCreate = deliveryMethods.map((method) => ({
      shortName: method.ShortName,
      description: method.Description,
      deliveryTime: method.DeliveryTime,
      price: method.Price,
    }));
    await DeliveryMethod.create(deliveryMethodsToCreate);
    console.log("--- Seeding Commercials... ---");
    const commercialsToCreate = commercials.map((comm) => ({
      name: comm.Name,
      image: comm.image,
    }));
    await Commercial.create(commercialsToCreate);
    console.log("Commercials seeded.");
    console.log("✅ Data successfully imported!");
    process.exit();
  } catch (error) {
    console.error("Error during data import:", error);
    process.exit(1);
  }
};
const deleteData = async () => {
  try {
    console.log("--- Deleting all data... ---");
    await Product.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();
    await DeliveryMethod.deleteMany();
    console.log("✅ Data successfully deleted!");
    process.exit();
  } catch (error) {
    console.error("Error during data deletion:", error);
    process.exit(1);
  }
};
if (process.argv[2] === "-i" || process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "-d" || process.argv[2] === "--delete") {
  deleteData();
} else {
  console.log("Please provide a flag to run the seeder:");
  console.log(
    "-i or --import : To import all data (deletes existing data first)."
  );
  console.log("-d or --delete : To delete all data from these collections.");
  process.exit();
}