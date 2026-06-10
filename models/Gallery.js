const mongoose = require("../server/db");

const GallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    eventType: { type: String, default: "" },
    description: { type: String, default: "" },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerId: { type: String, default: "" },
    eventDate: { type: Date, default: null },
    coverPhotoId: { type: String, default: "" },
    photoIds: [{ type: String }],
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
    createdBy: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", GallerySchema);
