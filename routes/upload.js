const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const multer = require("multer");

const Foto = require("../models/Foto");
const Gallery = require("../models/Gallery");
const { requireAuth, requireAdmin } = require("../server/security");

fs.mkdirSync(path.join(process.cwd(), "uploads"), { recursive: true });

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, "");
    cb(null, `${Date.now()}${safeExt}`);
  }
});

const upload = multer({ storage });

router.post("/", requireAuth, requireAdmin, upload.single("foto"), async (req, res) => {
  try {
    const { userId, galleryId, preco, evento, cidade, destaque, requiresAccess } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo é obrigatório." });
    }

    if (!galleryId) {
      return res.status(400).json({ error: "galleryId é obrigatório." });
    }

    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return res.status(404).json({ error: "Galeria não encontrada." });
    }

    const sourceUrl = `/uploads/${req.file.filename}`;
    const foto = await Foto.create({
      url: sourceUrl,
      sourceUrl,
      galleryId: String(gallery._id),
      userId: userId || req.auth.sub,
      preco: Number(preco || 50),
      evento: evento || gallery.title,
      cidade: cidade || gallery.eventType || "",
      destaque: destaque === "true" || destaque === true,
      requiresAccess: requiresAccess === "true" || requiresAccess === true,
      downloadableAfterPayment: true
    });

    gallery.photoIds = [...new Set([...(gallery.photoIds || []), String(foto._id)])];
    if (!gallery.coverPhotoId) {
      gallery.coverPhotoId = String(foto._id);
    }
    await gallery.save();

    res.json(foto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível enviar a foto." });
  }
});

module.exports = router;
