const mongoose = require("../server/db");

const GallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    eventType: { type: String, default: "" },
    description: { type: String, default: "" },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, trim: true, lowercase: true, default: "" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    eventDate: { type: Date, default: null },
    coverPhotoId: { type: mongoose.Schema.Types.ObjectId, ref: "Foto", default: null },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", GallerySchema);
