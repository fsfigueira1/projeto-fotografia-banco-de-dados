const express = require("express");
const request = require("supertest");

const { errorHandler } = require("../../server/middleware/errors");
const { sendError } = require("../../server/http/response");

function createMediaApp({ Photo, Purchase, mediaService }) {
  const { createMediaRouter } = require("../../routes/media");
  const app = express();
  const requireGallerySession = (req, res, next) => {
    const galleryId = req.headers["x-test-gallery"];
    if (!galleryId) {
      return sendError(res, {
        status: 401,
        message: "Galeria obrigatória.",
        error: "GALLERY_SESSION_REQUIRED"
      });
    }
    req.gallerySession = { galleryId };
    next();
  };
  const requireAuth = (req, res, next) => {
    const userId = req.headers["x-test-user"];
    if (!userId) {
      return sendError(res, {
        status: 401,
        message: "Autenticação obrigatória.",
        error: "AUTH_REQUIRED"
      });
    }
    req.user = { _id: userId };
    next();
  };

  app.use(
    "/api/media",
    createMediaRouter({
      Photo,
      Purchase,
      mediaService,
      requireGallerySession,
      requireAuth
    })
  );
  app.use(errorHandler);
  return app;
}

describe("protected media routes", () => {
  it("returns a preview only for the scoped gallery", async () => {
    const app = createMediaApp({
      Photo: {
        findById: vi.fn().mockResolvedValue({
          _id: "photo-1",
          galleryId: "gallery-1",
          storageProvider: "cloudinary",
          providerAssetId: "asset-1"
        })
      },
      Purchase: {},
      mediaService: {
        getPreviewUrl: vi.fn().mockReturnValue("https://cloudinary.test/preview")
      }
    });

    const response = await request(app)
      .get("/api/media/photos/photo-1/preview")
      .set("x-test-gallery", "gallery-1");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("https://cloudinary.test/preview");
  });

  it("rejects previews from another gallery", async () => {
    const app = createMediaApp({
      Photo: {
        findById: vi.fn().mockResolvedValue({
          _id: "photo-1",
          galleryId: "gallery-2",
          storageProvider: "cloudinary"
        })
      },
      Purchase: {},
      mediaService: {}
    });

    const response = await request(app)
      .get("/api/media/photos/photo-1/preview")
      .set("x-test-gallery", "gallery-1");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("PHOTO_NOT_AUTHORIZED");
  });

  it("allows downloads only for paid ownership", async () => {
    const Purchase = {
      findOne: vi.fn().mockResolvedValue({ _id: "purchase-1" })
    };
    const app = createMediaApp({
      Photo: {
        findById: vi.fn().mockResolvedValue({
          _id: "photo-1",
          galleryId: "gallery-1",
          storageProvider: "cloudinary",
          providerAssetId: "asset-1"
        })
      },
      Purchase,
      mediaService: {
        getDownloadUrl: vi.fn().mockReturnValue("https://cloudinary.test/download")
      }
    });

    const response = await request(app)
      .get("/api/media/photos/photo-1/download")
      .set("x-test-user", "user-1");

    expect(response.status).toBe(302);
    expect(Purchase.findOne).toHaveBeenCalledWith({
      userId: "user-1",
      status: "paid",
      photoIds: "photo-1"
    });
  });

  it("rejects downloads without a paid purchase", async () => {
    const app = createMediaApp({
      Photo: {
        findById: vi.fn().mockResolvedValue({
          _id: "photo-1",
          galleryId: "gallery-1",
          storageProvider: "cloudinary",
          providerAssetId: "asset-1"
        })
      },
      Purchase: {
        findOne: vi.fn().mockResolvedValue(null)
      },
      mediaService: {
        getDownloadUrl: vi.fn()
      }
    });

    const response = await request(app)
      .get("/api/media/photos/photo-1/download")
      .set("x-test-user", "user-1");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("PHOTO_NOT_PURCHASED");
  });
});
