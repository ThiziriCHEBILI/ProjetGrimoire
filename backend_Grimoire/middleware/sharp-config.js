const sharp = require("sharp");
const path = require("path");
const { StatusCodes } = require("http-status-codes");

module.exports = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const name = path.parse(req.file.originalname).name.split(" ").join("_");
  const filename = name + Date.now() + ".webp";

  try {
    await sharp(req.file.buffer)
      .resize({ width: 500, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join("images", filename));
  } catch (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Le fichier n'est pas une image." });
  }

  req.file.filename = filename;
  next();
};
