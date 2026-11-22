const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator").default;

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: [true, "L'email est obligatoire."],
    unique: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "L'email n'est pas valide."],
  },
  password: {
    type: String,
    required: [true, "Le mot de passe est obligatoire."],
  },
});

userSchema.plugin(uniqueValidator, { message: "Cet email est déjà utilisé." });

module.exports = mongoose.model("User", userSchema);
