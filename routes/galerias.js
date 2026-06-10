const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const Gallery = require("../models/Gallery");
const AccessCode = require("../models/AccessCode");
const Foto = require("../models/Foto");
const Compra = require("../models/Compra");
const { signGalleryToken, requireAuth, requireAdmin, requireGallerySession } = require("../server/security");

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function serializeGallery(gallery) {
  if (!gallery) return null;
  return {
    _id: gallery._id,
    title: gallery.title,
    slug: gallery.slug,
    eventType: gallery.eventType,
    description: gallery.description,
    customerName: gallery.customerName,
    customerEmail: gallery.customerEmail,
    customerId: gallery.customerId,
    eventDate: gallery.eventDate,
    coverPhotoId: gallery.coverPhotoId,
    photoIds: gallery.photoIds || [],
    status: gallery.status,
    createdBy: gallery.createdBy,
    createdAt: gallery.createdAt,
    updatedAt: gallery.updatedAt
  };
}

function serializeCode(code) {
  if (!code) return null;
  return {
    _id: code._id,
    galleryId: code.galleryId,
    label: code.label,
    active: code.active,
    expiresAt: code.expiresAt,
    customerName: code.customerName,
    customerEmail: code.customerEmail,
    customerId: code.customerId,
    createdBy: code.createdBy,
    lastUsedAt: code.lastUsedAt,
    createdAt: code.createdAt,
    updatedAt: code.updatedAt
  };
}

function serializePhoto(photo, galleryToken = null) {
  const source = photo.sourceUrl || photo.url || "";
  const encodedSource = encodeURIComponent(source);
  const imageUrl = galleryToken
    ? `/media/proxy?src=${encodedSource}&access=${encodeURIComponent(galleryToken)}`
    : source;

  return {
    _id: photo._id,
    url: imageUrl,
    galleryId: photo.galleryId || "",
    userId: photo.userId,
    preco: photo.preco,
    evento: photo.evento,
    cidade: photo.cidade,
    destaque: photo.destaque,
    requiresAccess: photo.requiresAccess,
    downloadableAfterPayment: photo.downloadableAfterPayment
  };
}

function buildGalleryPurchaseFilter(session) {
  return {
    galleryId: String(session.galleryId),
    accessCodeId: String(session.accessCodeId),
    status: "paid"
  };
}

async function resolveAccessCode(inputCode) {
  const normalized = normalizeCode(inputCode);
  if (!normalized) return null;

  const codes = await AccessCode.find({ active: true }).sort({ createdAt: -1 });
  for (const code of codes) {
    if (code.expiresAt && new Date(code.expiresAt).getTime() < Date.now()) {
      continue;
    }

    const match = await bcrypt.compare(normalized, code.codeHash);
    if (match) return code;
  }

  return null;
}

router.post("/acessar", async (req, res) => {
  try {
    const { code } = req.body;
    const accessCode = await resolveAccessCode(code);

    if (!accessCode) {
      return res.status(401).json({ error: "Senha inválida ou expirada." });
    }

    const gallery = await Gallery.findById(accessCode.galleryId);
    if (!gallery || gallery.status === "archived") {
      return res.status(404).json({ error: "Galeria não encontrada." });
    }

    const token = signGalleryToken({
      galleryId: String(gallery._id),
      accessCodeId: String(accessCode._id),
      customerName: gallery.customerName || accessCode.customerName || "",
      customerEmail: gallery.customerEmail || accessCode.customerEmail || ""
    });

    accessCode.lastUsedAt = new Date();
    await accessCode.save();

    const photos = await Foto.find({ galleryId: String(gallery._id) }).sort({ createdAt: -1 });

    res.json({
      token,
      gallery: serializeGallery(gallery),
      code: serializeCode(accessCode),
      photos: photos.map((photo) => serializePhoto(photo, token))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível abrir a galeria." });
  }
});

router.get("/me", requireGallerySession, async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.gallerySession.galleryId);
    if (!gallery) {
      return res.status(404).json({ error: "Galeria não encontrada." });
    }

    const photos = await Foto.find({ galleryId: String(gallery._id) }).sort({ createdAt: -1 });
    const purchases = await Compra.find(
      buildGalleryPurchaseFilter(req.gallerySession)
    );

    res.json({
      gallery: serializeGallery(gallery),
      photos: photos.map((photo) => serializePhoto(photo, req.query.access || req.headers["x-gallery-token"] || null)),
      purchases,
      session: req.gallerySession
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível carregar a galeria." });
  }
});

router.get("/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [galleries, accessCodes, purchases] = await Promise.all([
      Gallery.find({}).sort({ createdAt: -1 }),
      AccessCode.find({}).sort({ createdAt: -1 }),
      Compra.find({}).sort({ createdAt: -1 }).limit(100)
    ]);

    res.json({
      galleries: galleries.map(serializeGallery),
      accessCodes: accessCodes.map(serializeCode),
      purchases
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível carregar o painel administrativo." });
  }
});

router.post("/admin/galleries", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      eventType,
      description,
      customerName,
      customerEmail,
      customerId,
      eventDate,
      coverPhotoId,
      photoIds = [],
      status = "draft"
    } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: "Título e slug são obrigatórios." });
    }

    const gallery = await Gallery.create({
      title,
      slug,
      eventType,
      description,
      customerName,
      customerEmail,
      customerId,
      eventDate: eventDate || null,
      coverPhotoId,
      photoIds,
      status,
      createdBy: req.auth.sub
    });

    res.status(201).json(serializeGallery(gallery));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível criar a galeria." });
  }
});

router.patch("/admin/galleries/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const gallery = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!gallery) {
      return res.status(404).json({ error: "Galeria não encontrada." });
    }

    res.json(serializeGallery(gallery));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível atualizar a galeria." });
  }
});

router.delete("/admin/galleries/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await AccessCode.deleteMany({ galleryId: req.params.id });
    await Compra.updateMany(
      { galleryId: req.params.id },
      { $set: { galleryId: null } }
    );
    const deleted = await Gallery.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Galeria não encontrada." });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível excluir a galeria." });
  }
});

router.post("/admin/codes", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      galleryId,
      code,
      label = "",
      active = false,
      expiresAt = null,
      customerName = "",
      customerEmail = "",
      customerId = ""
    } = req.body;

    if (!galleryId || !code) {
      return res.status(400).json({ error: "galleryId e code são obrigatórios." });
    }

    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return res.status(404).json({ error: "Galeria não encontrada." });
    }

    const codeHash = await bcrypt.hash(normalizeCode(code), 10);
    const accessCode = await AccessCode.create({
      galleryId: String(gallery._id),
      codeHash,
      label,
      active,
      expiresAt: expiresAt || null,
      customerName,
      customerEmail,
      customerId,
      createdBy: req.auth.sub
    });

    res.status(201).json(serializeCode(accessCode));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível criar o código." });
  }
});

router.patch("/admin/codes/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.code) {
      payload.codeHash = await bcrypt.hash(normalizeCode(payload.code), 10);
      delete payload.code;
    }

    const accessCode = await AccessCode.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!accessCode) {
      return res.status(404).json({ error: "Código não encontrado." });
    }

    res.json(serializeCode(accessCode));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível atualizar o código." });
  }
});

router.delete("/admin/codes/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const removed = await AccessCode.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "Código não encontrado." });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível excluir o código." });
  }
});

router.get("/:galleryId", requireGallerySession, async (req, res) => {
  try {
    if (String(req.gallerySession.galleryId) !== String(req.params.galleryId)) {
      return res.status(403).json({ error: "Acesso não autorizado para esta galeria." });
    }

    const gallery = await Gallery.findById(req.params.galleryId);
    if (!gallery) {
      return res.status(404).json({ error: "Galeria não encontrada." });
    }

    const photos = await Foto.find({ galleryId: String(gallery._id) }).sort({ createdAt: -1 });
    res.json({
      gallery: serializeGallery(gallery),
      photos: photos.map((photo) => serializePhoto(photo, req.query.access || req.headers["x-gallery-token"] || null)),
      session: req.gallerySession
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível carregar a galeria." });
  }
});

module.exports = router;
module.exports.buildGalleryPurchaseFilter = buildGalleryPurchaseFilter;
