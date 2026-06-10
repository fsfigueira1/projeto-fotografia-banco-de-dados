const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const { requireGallerySession, requireAuth, requireAdmin } = require("../server/security");

function resolveUploadPath(fileName) {
  return path.join(process.cwd(), "uploads", path.basename(fileName));
}

router.get("/admin/:fileName", requireAuth, requireAdmin, async (req, res) => {
  try {
    const filePath = resolveUploadPath(req.params.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    res.setHeader("Cache-Control", "private, no-store");
    return res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível carregar a imagem." });
  }
});

router.get("/proxy", requireGallerySession, async (req, res) => {
  try {
    const source = String(req.query.src || "");
    if (!source) {
      return res.status(400).json({ error: "src é obrigatório." });
    }

    res.setHeader("Cache-Control", "private, no-store");

    if (source.startsWith("/uploads/")) {
      const filePath = resolveUploadPath(source.split("/").pop());
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Imagem não encontrada." });
      }
      return res.sendFile(filePath);
    }

    if (!/^https?:\/\//i.test(source)) {
      return res.status(400).json({ error: "Origem inválida." });
    }

    const remote = await fetch(source);
    if (!remote.ok) {
      return res.status(502).json({ error: "Não foi possível carregar a imagem remota." });
    }

    res.setHeader("Content-Type", remote.headers.get("content-type") || "image/jpeg");
    const arrayBuffer = await remote.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível carregar a imagem." });
  }
});

router.get("/:fileName", requireGallerySession, async (req, res) => {
  try {
    const filePath = resolveUploadPath(req.params.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    res.setHeader("Cache-Control", "private, no-store");
    return res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível carregar a imagem." });
  }
});

module.exports = router;
