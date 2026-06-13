const express = require("express");
const multer = require("multer");

const GalleryModel = require("../models/Gallery");
const PhotoModel = require("../models/Foto");
const { sendError, sendSuccess } = require("../server/http/response");
const {
  requireAdmin: defaultRequireAdmin,
  requireAuth: defaultRequireAuth
} = require("../server/middleware/auth");
const { createMediaService } = require("../server/services/media");

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
]);

function createUploadMiddleware(maxUploadMb) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: Math.max(1, Number(maxUploadMb || 10)) * 1024 * 1024,
      files: 1
    },
    fileFilter(_req, file, callback) {
      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        const error = new Error("Envie uma imagem JPEG, PNG, WebP ou AVIF.");
        error.status = 400;
        error.code = "INVALID_IMAGE_TYPE";
        return callback(error);
      }
      return callback(null, true);
    }
  }).single("foto");
}

function createUploadRouter({
  Gallery = GalleryModel,
  Photo = PhotoModel,
  mediaService = null,
  env = null,
  requireAuth = defaultRequireAuth,
  requireAdmin = defaultRequireAdmin
} = {}) {
  const router = express.Router();
  const upload = createUploadMiddleware(
    env?.MAX_UPLOAD_MB || process.env.MAX_UPLOAD_MB || 10
  );
  const getMediaService = () => mediaService || createMediaService();

  router.post(
    "/",
    requireAuth,
    requireAdmin,
    upload,
    async (req, res, next) => {
      try {
        if (!req.file) {
          return sendError(res, {
            status: 400,
            message: "Arquivo de imagem obrigatório.",
            error: "IMAGE_REQUIRED"
          });
        }

        const galleryId = String(req.body.galleryId || "");
        if (!galleryId) {
          return sendError(res, {
            status: 400,
            message: "Galeria obrigatória.",
            error: "GALLERY_REQUIRED"
          });
        }

        const gallery = await Gallery.findById(galleryId);
        if (!gallery) {
          return sendError(res, {
            status: 404,
            message: "Galeria não encontrada.",
            error: "GALLERY_NOT_FOUND"
          });
        }

        const media = await getMediaService().uploadImage({
          buffer: req.file.buffer,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          galleryId
        });

        const price = Number(req.body.preco ?? 50);
        if (!Number.isFinite(price) || price < 0) {
          return sendError(res, {
            status: 400,
            message: "Preço inválido.",
            error: "INVALID_PHOTO_PRICE"
          });
        }

        const photo = await Photo.create({
          url: media.url,
          sourceUrl: media.sourceUrl,
          storageProvider: media.storageProvider,
          providerAssetId: media.providerAssetId,
          galleryId: gallery._id,
          userId: req.user?._id || req.auth?.sub,
          preco: price,
          evento: String(req.body.evento || gallery.title || ""),
          cidade: String(req.body.cidade || gallery.eventType || ""),
          destaque: req.body.destaque === "true" || req.body.destaque === true,
          requiresAccess: req.body.requiresAccess === undefined
            ? true
            : req.body.requiresAccess === "true" ||
              req.body.requiresAccess === true,
          downloadableAfterPayment: true
        });

        if (!gallery.coverPhotoId) {
          gallery.coverPhotoId = photo._id;
          await gallery.save();
        }

        return sendSuccess(res, {
          status: 201,
          data: { photo },
          message: "Foto enviada com sucesso."
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}

module.exports = createUploadRouter();
module.exports.ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;
module.exports.createUploadMiddleware = createUploadMiddleware;
module.exports.createUploadRouter = createUploadRouter;
