const mongoose = require("../server/db");

const AccessCodeSchema = new mongoose.Schema(
  {
    galleryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gallery",
      required: true,
      index: true
    },
    label: { type: String, default: "" },
    codeHash: { type: String, required: true },
    active: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, default: null, index: true },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, trim: true, lowercase: true, default: "" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    lastUsedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessCode", AccessCodeSchema);
