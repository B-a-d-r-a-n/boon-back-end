import multer from "multer";
import path from "path";
import GenericException from "../exceptions/GenericException.mjs";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `user-${req.user._id}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueSuffix);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/jpeg") ||
    file.mimetype.startsWith("image/png")
  ) {
    cb(null, true);
  } else {
    cb(
      new GenericException(
        400,
        "Only JPG and PNG images are allowed for avatars."
      ),
      false
    );
  }
};
const avatarUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 }, 
});
export default avatarUpload;