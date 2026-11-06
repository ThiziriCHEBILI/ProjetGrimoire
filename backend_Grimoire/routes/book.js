const express = require("express");
const router = express.Router();
const bookCtrl = require("../controllers/book");
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const sharp = require("../middleware/sharp-config");

router.get("/", bookCtrl.getAllBooks);
router.get("/:id", bookCtrl.getOneBook);
router.post("/", auth, multer, sharp, bookCtrl.createBook);

module.exports = router;
