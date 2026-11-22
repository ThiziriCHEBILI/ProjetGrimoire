const multer = require("multer");

const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

module.exports = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
}).single("image");
