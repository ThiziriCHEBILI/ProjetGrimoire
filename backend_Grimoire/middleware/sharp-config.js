const sharp = require("sharp");
const path = require("path");

module.exports = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const name = path.parse(req.file.originalname).name.split(" ").join("_");
  const filename = name + Date.now() + ".webp";

  sharp(req.file.buffer)
    .resize({ width: 500, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join("images", filename))
    .then(() => {
      req.file.filename = filename;
      next();
    })
    .catch((error) => res.status(400).json({ error }));
};
