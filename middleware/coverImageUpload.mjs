import multer from "multer";
import GenericException from "../exceptions/GenericException.mjs";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/covers/"); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `cover-${Date.now()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new GenericException(400, "Image files only."), false);
  }
};
const coverImageUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, 
});
export default coverImageUpload;