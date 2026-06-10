const mongoose = require("../server/db");

const UserSchema = new mongoose.Schema(
  {
    nome: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, index: true },
    senha: { type: String },
    role: { type: String, default: "client", enum: ["client", "admin"] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

