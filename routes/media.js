const express = require("express");
const fs = require("fs");
const path = require("path");

const PhotoModel = require("../models/Foto");
const PurchaseModel = require("../models/Compra");
const {
  requireAdmin: defaultRequireAdmin,
  requireAuth: defaultRequireAuth
} = require("../server/middleware/auth");
const {
  requireGallerySession: defaultRequireGallerySession
} = require("../server/security");
const { createMediaService } = require("../server/services/media");

function resolveUploadPath(fileName) {
  return path.join(process.cwd(), "uploads", path.basename(fileName));
}

function createRouteError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function createMediaRouter({
  Photo = PhotoModel,
  Purchase = PurchaseModel,
  mediaService = createMediaService(),
  requireGallerySession = defaultRequireGallerySession,
  requireAuth = defaultRequireAuth,
  requireAdmin = defaultRequireAdmin
} = {}) {
  const router = express.Router();

  router.get(
    "/photos/:photoId/preview",
    requireGallerySession,
    async (req, res, next) => {
      try {
        const photo = await Photo.findById(req.params.photoId);
        if (!photo) {
          throw createRouteError(
            "Foto não encontrada.",
            404,
            "PHOTO_NOT_FOUND"
          );
        }
        if (
          String(photo.galleryId) !==
          String(req.gallerySession.galleryId)
        ) {
          throw createRouteError(
            "Foto não autorizada para esta galeria.",
            403,
            "PHOTO_NOT_AUTHORIZED"
          );
        }

        res.setHeader("Cache-Control", "private, no-store");
        const localPath = mediaService.getLocalFilePath?.(photo);
        if (localPath) return res.sendFile(localPath);
        return res.redirect(mediaService.getPreviewUrl(photo));
      } catch (error) {
        return next(error);
      }
    }
  );

  router.get(
    "/photos/:photoId/download",
    requireAuth,
    async (req, res, next) => {
      try {
        const photo = await Photo.findById(req.params.photoId);
        if (!photo) {
          throw createRouteError(
            "Foto não encontrada.",
            404,
            "PHOTO_NOT_FOUND"
          );
        }

        const purchase = await Purchase.findOne({
          userId: req.user._id,
          status: "paid",
          photoIds: String(photo._id)
        });
        if (!purchase) {
          throw createRouteError(
            "Pagamento aprovado obrigatório para download.",
            403,
            "PHOTO_NOT_PURCHASED"
          );
        }

        res.setHeader("Cache-Control", "private, no-store");
        const localPath = mediaService.getLocalFilePath?.(photo);
        if (localPath) return res.download(localPath);
        return res.redirect(mediaService.getDownloadUrl(photo));
      } catch (error) {
        return next(error);
      }
    }
  );

  router.get("/admin/:fileName", requireAuth, requireAdmin, (req, res, next) => {
    try {
      const filePath = resolveUploadPath(req.params.fileName);
      if (!fs.existsSync(filePath)) {
        throw createRouteError(
          "Imagem não encontrada.",
          404,
          "IMAGE_NOT_FOUND"
        );
      }

      res.setHeader("Cache-Control", "private, no-store");
      return res.sendFile(filePath);
    } catch (error) {
      return next(error);
    }
  });

  router.get("/proxy", requireGallerySession, async (req, res, next) => {
    try {
      const source = String(req.query.src || "");
      if (!source) {
        throw createRouteError(
          "src é obrigatório.",
          400,
          "MEDIA_SOURCE_REQUIRED"
        );
      }

      res.setHeader("Cache-Control", "private, no-store");

      if (source.startsWith("/uploads/")) {
        const filePath = resolveUploadPath(source.split("/").pop());
        if (!fs.existsSync(filePath)) {
          throw createRouteError(
            "Imagem não encontrada.",
            404,
            "IMAGE_NOT_FOUND"
          );
        }
        return res.sendFile(filePath);
      }

      if (!/^https?:\/\//i.test(source)) {
        throw createRouteError(
          "Origem inválida.",
          400,
          "INVALID_MEDIA_SOURCE"
        );
      }

      const remote = await fetch(source);
      if (!remote.ok) {
        throw createRouteError(
          "Não foi possível carregar a imagem remota.",
          502,
          "REMOTE_MEDIA_UNAVAILABLE"
        );
      }

      res.setHeader(
        "Content-Type",
        remote.headers.get("content-type") || "image/jpeg"
      );
      const arrayBuffer = await remote.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:fileName", requireGallerySession, (req, res, next) => {
    try {
      const filePath = resolveUploadPath(req.params.fileName);
      if (!fs.existsSync(filePath)) {
        throw createRouteError(
          "Imagem não encontrada.",
          404,
          "IMAGE_NOT_FOUND"
        );
      }

      res.setHeader("Cache-Control", "private, no-store");
      return res.sendFile(filePath);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createMediaRouter();
module.exports.createMediaRouter = createMediaRouter;
module.exports.resolveUploadPath = resolveUploadPath;
