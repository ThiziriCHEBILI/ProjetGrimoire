const express = require("express");
const router = express.Router();
const bookCtrl = require("../controllers/book");
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const sharp = require("../middleware/sharp-config");
const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");

// un id mal écrit (ex. /api/books/abc) → 400, avant auth, multer et sharp
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Identifiant invalide." });
  }
  next();
});

router.get("/", bookCtrl.getAllBooks);
router.get("/bestrating", bookCtrl.getBestRating);
router.get("/:id", bookCtrl.getOneBook);
router.post("/", auth, multer, sharp, bookCtrl.createBook);
router.put("/:id", auth, multer, sharp, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.post("/:id/rating", auth, bookCtrl.rateBook);

module.exports = router;
