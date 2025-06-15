// middleware/coverImageUpload.mjs
import multer from "multer";
import GenericException from "../exceptions/GenericException.mjs";
// ... other imports

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/covers/"); // Saves to a different folder
  },
  filename: (req, file, cb) => {
    // Could use article ID if updating, or just a timestamp if creating
    const uniqueSuffix = `cover-${Date.now()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (req, file, cb) => {
  // Maybe a more lenient filter here
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new GenericException(400, "Image files only."), false);
  }
};

const coverImageUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // Larger 10MB limit for covers
});

export default coverImageUpload;
