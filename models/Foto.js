const mongoose = require("../server/db");

const FotoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    sourceUrl: { type: String, default: "" },
    galleryId: { type: String, default: "", index: true },
    userId: { type: String, required: true, index: true },
    preco: { type: Number, default: 50 },
    evento: { type: String, default: "" },
    cidade: { type: String, default: "" },
    destaque: { type: Boolean, default: false },
    requiresAccess: { type: Boolean, default: false },
    downloadableAfterPayment: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Foto", FotoSchema);
