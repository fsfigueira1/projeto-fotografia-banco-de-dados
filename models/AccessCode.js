const mongoose = require("../server/db");

const AccessCodeSchema = new mongoose.Schema(
  {
    galleryId: { type: String, required: true, index: true },
    label: { type: String, default: "" },
    codeHash: { type: String, required: true },
    active: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, default: null, index: true },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerId: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    lastUsedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessCode", AccessCodeSchema);
