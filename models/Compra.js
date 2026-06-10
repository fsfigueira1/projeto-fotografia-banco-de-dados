const mongoose = require("../server/db");

const CompraSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    fotoId: { type: mongoose.Schema.Types.ObjectId, ref: "Foto", default: null },
    photoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Foto" }],
    serviceId: { type: String, trim: true, default: "" },
    galleryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gallery",
      default: null,
      index: true
    },
    accessCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessCode",
      default: null,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ["photo", "service"],
      default: "photo"
    },
    paymentMethod: { type: String, trim: true, default: "card" },
    paymentProvider: {
      type: String,
      enum: ["stripe"],
      default: "stripe"
    },
    total: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      lowercase: true,
      default: "brl"
    },
    pago: { type: Boolean, default: false },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    paymentIntentId: { type: String, default: "" },
    status: {
      type: String,
      required: true,
      enum: ["pending", "paid", "failed", "canceled"],
      default: "pending",
      index: true
    },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    canceledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Compra", CompraSchema);
