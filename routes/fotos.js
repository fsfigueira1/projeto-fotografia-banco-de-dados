const express = require("express");

const PhotoModel = require("../models/Foto");
const PurchaseModel = require("../models/Compra");
const { sendSuccess } = require("../server/http/response");
const { requireAuth: defaultRequireAuth } = require("../server/middleware/auth");
const {
  requireGallerySession: defaultRequireGallerySession
} = require("../server/security");

function createPhotoRouter({
  Photo = PhotoModel,
  Purchase = PurchaseModel,
  requireAuth = defaultRequireAuth,
  requireGallerySession = defaultRequireGallerySession
} = {}) {
  const router = express.Router();

  router.get("/", async (_req, res, next) => {
    try {
      const photos = await Photo.find({
        $or: [
          { galleryId: { $in: [null, ""] } },
          { requiresAccess: false }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(60);

      return sendSuccess(res, {
        data: { photos },
        message: "Galeria pública carregada."
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/purchased", requireAuth, async (req, res, next) => {
    try {
      const purchases = await Purchase.find({
        userId: req.user._id,
        status: "paid"
      });
      const photoIds = [
        ...new Set(
          purchases.flatMap((purchase) =>
            (purchase.photoIds || []).map(String)
          )
        )
      ];
      const photos = photoIds.length
        ? await Photo.find({ _id: { $in: photoIds } })
        : [];

      return sendSuccess(res, {
        data: { photos },
        message: "Fotos compradas carregadas."
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get(
    "/gallery/:galleryId",
    requireGallerySession,
    async (req, res, next) => {
      try {
        if (
          String(req.gallerySession.galleryId) !==
          String(req.params.galleryId)
        ) {
          const error = new Error("Acesso não autorizado.");
          error.status = 403;
          error.code = "GALLERY_FORBIDDEN";
          throw error;
        }

        const photos = await Photo.find({
          galleryId: req.params.galleryId
        }).sort({ createdAt: -1 });
        return sendSuccess(res, {
          data: { photos },
          message: "Fotos da galeria carregadas."
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  router.get(
    "/galeria/:galleryId",
    requireGallerySession,
    async (req, res, next) => {
      try {
        if (
          String(req.gallerySession.galleryId) !==
          String(req.params.galleryId)
        ) {
          const error = new Error("Acesso não autorizado.");
          error.status = 403;
          error.code = "GALLERY_FORBIDDEN";
          throw error;
        }
        const photos = await Photo.find({
          galleryId: req.params.galleryId
        }).sort({ createdAt: -1 });
        return sendSuccess(res, {
          data: { photos },
          message: "Fotos da galeria carregadas."
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}

module.exports = createPhotoRouter();
module.exports.createPhotoRouter = createPhotoRouter;
