import multer from "multer";

// Use memoryStorage to temporarily hold the file in a buffer
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (adjust as needed)
  },
});

export default upload;
