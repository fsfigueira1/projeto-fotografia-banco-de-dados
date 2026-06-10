const mongoose = require("../server/db");

const CompraSchema = new mongoose.Schema({
  userId: String,
  fotoId: String,
  photoIds: [String],
  serviceId: String,
  galleryId: String,
  accessCodeId: String,
  type: { type: String, default: "photo" },
  paymentMethod: { type: String, default: "card" },
  paymentProvider: { type: String, default: "stripe" },
  total: { type: Number, default: 0 },
  pago: Boolean,
  sessionId: String,
  status: { type: String, default: "pending" }
});

module.exports = mongoose.model("Compra", CompraSchema);

