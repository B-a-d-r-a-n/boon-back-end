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
    // The folder in your Cloudinary account where images will be stored
    folder: "bloggy_covers",
    // Allowed formats for uploaded images
    allowed_formats: ["jpeg", "png", "jpg", "webp"],
    // Optional: A transformation to apply to every uploaded image.
    // This is incredibly powerful. Here, we're resizing images to a max width
    // of 1200px and auto-optimizing the quality and format.
    transformation: [{ width: 1200, height: 630, crop: "limit" }],
    // public_id can be used to set a custom filename.
    // Here, we leave it to Cloudinary to generate a unique ID.
  },
});

// Create the Multer upload instance
const upload = multer({ storage: storage });

export default upload;
