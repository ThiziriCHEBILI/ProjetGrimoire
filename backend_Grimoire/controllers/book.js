const fs = require("fs");
const Book = require("../models/Book");

// getAllBooks : renvoie tous les livres
// Route : GET /api/books (pas besoin d'être connecté)
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(500).json({ error }));
};

// getOneBook : renvoie un seul livre, avec son id
// Route : GET /api/books/:id (pas besoin d'être connecté)
exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // la recherche a marché, mais aucun livre avec cet id
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      res.status(200).json(book);
    })
    .catch((error) => res.status(500).json({ error }));
};

// getBestRating : renvoie les 3 livres les mieux notés
// Route : GET /api/books/bestrating
exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3) // on garde les 3 premiers
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(500).json({ error }));
};

// createBook : crée un livre
// Route : POST /api/books
exports.createBook = (req, res, next) => {
  // sans image, on ne peut pas créer l'imageUrl
  if (!req.file) {
    return res.status(400).json({ message: "Image obligatoire" });
  }

  const bookObject = JSON.parse(req.body.book);

  // on ne fait pas confiance au front pour ces deux champs
  delete bookObject._id;
  delete bookObject.userId;

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
    ratings: [],
    averageRating: 0,
  });

  book
    .save() // enregistre dans la base
    .then(() => res.status(201).json({ message: "Livre enregistré !" }))
    .catch((error) => {
      if (error.name === "ValidationError") {
        const errors = {};
        for (const field in error.errors) {
          errors[field] = error.errors[field].message;
        }
        return res.status(400).json({ errors });
      }
      res.status(500).json({ error });
    });
};

// modifyBook : modifie un livre (seulement par son créateur)
// Route : PUT /api/books/:id
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
      }
    : { ...req.body };

  // champs qu'on ne peut pas changer
  delete bookObject._id;
  delete bookObject.userId;
  delete bookObject.ratings;
  delete bookObject.averageRating;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      // on compare le créateur du livre avec la personne du token
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "403: unauthorized request" });
      }

      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id },
        { runValidators: true },
      )
        .then(() => {
          // si l'image a changé, on supprime l'ancienne du dossier images
          if (req.file) {
            const oldFilename = book.imageUrl.split("/images/")[1];
            fs.unlink(`images/${oldFilename}`, (error) => {
              if (error) console.log(error);
            });
          }
          res.status(200).json({ message: "Livre modifié !" });
        })
        .catch((error) => {
          if (error.name === "ValidationError") {
            const errors = {};
            for (const field in error.errors) {
              errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ errors });
          }
          res.status(500).json({ error });
        });
    })
    .catch((error) => res.status(500).json({ error }));
};
// deleteBook : supprime un livre et son image (seulement par son créateur)
// Route : DELETE /api/books/:id
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "403: unauthorized request" });
      }

      // on récupère le nom du fichier à partir de l'imageUrl
      const filename = book.imageUrl.split("/images/")[1];

      // d'abord on supprime l'image, ensuite le livre
      fs.unlink(`images/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Livre supprimé !" }))
          .catch((error) => res.status(500).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

// rateBook : ajoute une note et recalcule la moyenne
// Route : POST /api/books/:id/rating
exports.rateBook = (req, res, next) => {
  const grade = Number(req.body.rating);

  if (isNaN(grade) || grade < 0 || grade > 5) {
    return res
      .status(400)
      .json({ message: "La note doit être comprise entre 0 et 5" });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }

      // on cherche si cette personne a déjà noté ce livre
      const alreadyRated = book.ratings.find(
        (rating) => rating.userId === req.auth.userId,
      );
      if (alreadyRated) {
        return res
          .status(400)
          .json({ message: "Vous avez déjà noté ce livre" });
      }

      book.ratings.push({ userId: req.auth.userId, grade: grade });

      const total = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
      book.averageRating = Math.round((total / book.ratings.length) * 10) / 10;

      book
        .save()
        .then((updatedBook) => res.status(200).json(updatedBook))
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
