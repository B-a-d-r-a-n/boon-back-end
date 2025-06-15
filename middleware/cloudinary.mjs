import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Configure the Cloudinary SDK with your credentials from the .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "bloggy_covers",
    allowed_formats: ["jpeg", "png", "jpg", "webp"],
    transformation: [{ width: 1200, height: 630, crop: "limit" }],
  },
});

// Create the Multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    // Set the file size limit here. 5MB is a generous but safe limit.
    fileSize: 5 * 1024 * 1024, // 5 Megabytes
  },
});

export default upload;
