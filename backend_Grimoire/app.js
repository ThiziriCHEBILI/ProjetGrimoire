require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const { StatusCodes } = require("http-status-codes");
const userRoutes = require("./routes/user");
const bookRoutes = require("./routes/book");
const app = express();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch((error) => console.log("Connexion à MongoDB échouée !", error));

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  next();
});

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/auth", userRoutes);
app.use("/api/books", bookRoutes);

// aucune route n'a répondu : 404 en JSON
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: "Ressource introuvable." });
});

// erreurs non gérées : réponse JSON, la trace reste dans le terminal
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof SyntaxError) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Les données envoyées ne sont pas un JSON valide." });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(StatusCodes.REQUEST_TOO_LONG)
      .json({ message: "L'image est trop lourde (5 Mo maximum)." });
  }
  if (err.name === "MulterError") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "L'image doit être envoyée dans le champ image." });
  }
  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: "Erreur du serveur." });
});

module.exports = app;
