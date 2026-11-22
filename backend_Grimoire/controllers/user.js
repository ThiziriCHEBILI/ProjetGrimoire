const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ message: "Email et mot de passe obligatoires." });
  }
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      user
        .save()
        .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
        .catch((error) => {
          if (error.name === "ValidationError") {
            const errors = {};
            for (const field in error.errors) {
              errors[field] = error.errors[field].message;
            }
            return res.status(400).json({ errors });
          }
          res.status(500).json({ message: "Erreur du serveur." });
        });
    })
    .catch((error) => res.status(500).json({ message: "Erreur du serveur." }));
};

exports.login = (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ message: "Email et mot de passe obligatoires." });
  }
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ message: "Paire identifiant/mot de passe incorrecte" });
      }

      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res
              .status(401)
              .json({ message: "Paire identifiant/mot de passe incorrecte" });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) =>
          res.status(500).json({ message: "Erreur du serveur." }),
        );
    })
    .catch((error) => res.status(500).json({ message: "Erreur du serveur." }));
};
