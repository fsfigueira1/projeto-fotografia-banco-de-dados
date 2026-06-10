const express = require("express");
const router = express.Router();

const Foto = require("../models/Foto");
const Compra = require("../models/Compra");
const { requireGallerySession } = require("../server/security");

router.get("/", async (_req, res) => {
  try {
    const fotos = await Foto.find({
      $or: [{ galleryId: { $in: [null, ""] } }, { requiresAccess: false }]
    })
      .sort({ createdAt: -1 })
      .limit(60);

    res.json(fotos);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao carregar galeria pública");
  }
});

router.get("/compradas/:userId", async (req, res) => {
  try {
    const compras = await Compra.find({
      userId: req.params.userId,
      pago: true
    });

    const photosIds = compras.flatMap((c) => c.photoIds || (c.fotoId ? [c.fotoId] : []));
    const fotos = await Foto.find({ _id: { $in: photosIds } });

    res.json(fotos);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao carregar fotos compradas");
  }
});

router.get("/galeria/:galleryId", requireGallerySession, async (req, res) => {
  try {
    if (String(req.gallerySession.galleryId) !== String(req.params.galleryId)) {
      return res.status(403).json({ error: "Acesso não autorizado." });
    }

    const fotos = await Foto.find({ galleryId: req.params.galleryId }).sort({ createdAt: -1 });
    res.json(fotos);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao carregar fotos da galeria");
  }
});

module.exports = router;
