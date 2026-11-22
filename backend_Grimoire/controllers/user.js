const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email et mot de passe obligatoires." });
  }

  try {
    // le mot de passe n'est jamais enregistré en clair
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hash,
    });
    await user.save();
    res.status(StatusCodes.CREATED).json({ message: "Utilisateur créé !" });
  } catch (error) {
    // email invalide ou déjà utilisé (règles du modèle User)
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

// POST /api/auth/login
exports.login = async (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email et mot de passe obligatoires." });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    // même message si l'email ou le mot de passe est faux : on ne révèle pas quels emails existent
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Paire identifiant/mot de passe incorrecte" });
    }

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Paire identifiant/mot de passe incorrecte" });
    }

    res.status(StatusCodes.OK).json({
      userId: user._id,
      token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      }),
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur du serveur." });
  }
};
