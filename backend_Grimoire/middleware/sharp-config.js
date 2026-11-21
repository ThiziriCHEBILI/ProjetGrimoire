const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

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
      // si la requête finit par une erreur, l'image ne sert à rien : on la supprime
      res.on("finish", () => {
        if (res.statusCode >= 400) {
          fs.unlink(path.join("images", filename), () => {});
        }
      });
      next();
    })
    .catch(() =>
      res.status(400).json({ message: "Le fichier n'est pas une image." }),
    );
};
