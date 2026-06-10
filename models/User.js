const mongoose = require("../server/db");

const UserSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    senha: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      required: true,
      default: "client",
      enum: ["client", "admin"],
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

