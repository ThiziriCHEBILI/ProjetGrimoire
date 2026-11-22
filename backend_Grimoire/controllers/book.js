const fs = require("fs");
const Book = require("../models/Book");
const { StatusCodes } = require("http-status-codes");

// GET /api/books (public)
exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(StatusCodes.OK).json(books);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur du serveur." });
  }
};

// GET /api/books/:id (public)
exports.getOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Livre non trouvé" });
    }
    res.status(StatusCodes.OK).json(book);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur du serveur." });
  }
};

// GET /api/books/bestrating (public) : les 3 livres les mieux notés
exports.getBestRating = async (req, res, next) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 }).limit(3);
    res.status(StatusCodes.OK).json(books);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur du serveur." });
  }
};

// POST /api/books (auth → multer → sharp)
exports.createBook = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Image obligatoire" });
  }

  let bookObject;
  try {
    bookObject = JSON.parse(req.body.book);
  } catch (error) {
    fs.unlink(`images/${req.file.filename}`, () => {});
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Les données envoyées ne sont pas un JSON valide." });
  }

  // on ne fait pas confiance au front : l'id est créé par MongoDB, le userId vient du token
  delete bookObject._id;
  delete bookObject.userId;

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
    ratings: [],
    averageRating: 0,
  });

  try {
    await book.save();
    res.status(StatusCodes.CREATED).json({ message: "Livre enregistré !" });
  } catch (error) {
    // le livre n'est pas enregistré : on supprime l'image pour ne pas la laisser orpheline
    fs.unlink(`images/${req.file.filename}`, () => {});
    if (error.name === "ValidationError") {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(StatusCodes.BAD_REQUEST).json({ errors });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur du serveur." });
  }
};

// PUT /api/books/:id (auth → multer → sharp), seulement par le créateur du livre
exports.modifyBook = async (req, res, next) => {
  // avec une nouvelle image, le livre arrive en texte dans req.body.book
  let bookObject;
  try {
    bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
        }
      : { ...req.body };
  } catch (error) {
    fs.unlink(`images/${req.file.filename}`, () => {});
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Les données envoyées ne sont pas un JSON valide." });
  }

  // champs que l'utilisateur n'a pas le droit de changer
  delete bookObject._id;
  delete bookObject.userId;
  delete bookObject.ratings;
  delete bookObject.averageRating;

  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      if (req.file) fs.unlink(`images/${req.file.filename}`, () => {});
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Livre non trouvé" });
    }
    if (book.userId !== req.auth.userId) {
      if (req.file) fs.unlink(`images/${req.file.filename}`, () => {});
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "403: unauthorized request" });
    }

    // updateOne ne lance pas les validateurs par défaut
    await Book.updateOne(
      { _id: req.params.id },
      { ...bookObject, _id: req.params.id },
      { runValidators: true },
    );

    // la modification a réussi : on peut supprimer l'ancienne image
    if (req.file) {
      const oldFilename = book.imageUrl.split("/images/")[1];
      fs.unlink(`images/${oldFilename}`, (error) => {
        if (error) console.log(error);
      });
    }
    res.status(StatusCodes.OK).json({ message: "Livre modifié !" });
  } catch (error) {
    if (req.file) fs.unlink(`images/${req.file.filename}`, () => {});
    if (error.name === "ValidationError") {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(StatusCodes.BAD_REQUEST).json({ errors });
    }
    // avec updateOne, une année en texte donne une CastError (pas une ValidationError)
    if (error.name === "CastError") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ errors: { [error.path]: error.message } });
    }
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur du serveur." });
  }
};

// DELETE /api/books/:id (auth), seulement par le créateur du livre
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Livre non trouvé" });
    }
    if (book.userId !== req.auth.userId) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "403: unauthorized request" });
    }

    await Book.deleteOne({ _id: req.params.id });

    // le livre est supprimé : on peut supprimer son image
    const filename = book.imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, (error) => {
      if (error) console.log(error);
    });
    res.status(StatusCodes.OK).json({ message: "Livre supprimé !" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur du serveur." });
  }
};

// POST /api/books/:id/rating (auth) : ajoute une note et recalcule la moyenne
exports.rateBook = async (req, res, next) => {
  const grade = Number(req.body.rating);

  if (isNaN(grade) || grade < 0 || grade > 5) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "La note doit être comprise entre 0 et 5" });
  }

  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Livre non trouvé" });
    }

    // un utilisateur ne peut noter un livre qu'une seule fois
    const alreadyRated = book.ratings.find(
      (rating) => rating.userId === req.auth.userId,
    );
    if (alreadyRated) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Vous avez déjà noté ce livre" });
    }

    // le userId vient du token, pas du body
    book.ratings.push({ userId: req.auth.userId, grade: grade });

    // moyenne arrondie à 1 chiffre après la virgule
    const total = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
    book.averageRating = Math.round((total / book.ratings.length) * 10) / 10;

    const updatedBook = await book.save();
    res.status(StatusCodes.OK).json(updatedBook);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur du serveur." });
  }
};
