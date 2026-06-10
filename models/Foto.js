const mongoose = require("../server/db");

const FotoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    sourceUrl: { type: String, default: "" },
    galleryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gallery",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    preco: { type: Number, default: 50, min: 0 },
    evento: { type: String, default: "" },
    cidade: { type: String, default: "" },
    destaque: { type: Boolean, default: false },
    requiresAccess: { type: Boolean, default: false },
    downloadableAfterPayment: { type: Boolean, default: true },
    storageProvider: {
      type: String,
      enum: ["local", "cloudinary"],
      default: "local"
    },
    providerAssetId: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Foto", FotoSchema);
