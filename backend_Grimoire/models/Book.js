const mongoose = require("mongoose");

const bookSchema = mongoose.Schema({
  userId: { type: String, required: true },
  title: {
    type: String,
    required: [true, "Le titre est obligatoire."],
    trim: true,
  },
  author: {
    type: String,
    required: [true, "L'auteur est obligatoire."],
    trim: true,
  },
  imageUrl: { type: String, required: [true, "L'image est obligatoire."] },
  year: {
    type: Number,
    required: [true, "L'année est obligatoire."],
    cast: "L'année doit être un nombre.",
  },
  genre: {
    type: String,
    required: [true, "Le genre est obligatoire."],
    trim: true,
  },
  ratings: [
    {
      userId: { type: String, required: true },
      grade: { type: Number, required: true },
    },
  ],
  averageRating: { type: Number, required: true },
});

module.exports = mongoose.model("Book", bookSchema);
