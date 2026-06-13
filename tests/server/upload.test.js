const express = require("express");
const request = require("supertest");

const { errorHandler } = require("../../server/middleware/errors");

function createUploadApp({ Gallery, Photo, mediaService }) {
  const { createUploadRouter } = require("../../routes/upload");
  const app = express();
  const requireAuth = (req, _res, next) => {
    req.user = { _id: "507f1f77bcf86cd799439011", role: "admin" };
    req.auth = { sub: req.user._id, role: "admin" };
    next();
  };
  const requireAdmin = (_req, _res, next) => next();

  app.use(
    "/api/uploads",
    createUploadRouter({
      Gallery,
      Photo,
      mediaService,
      env: { MAX_UPLOAD_MB: 1 },
      requireAuth,
      requireAdmin
    })
  );
  app.use(errorHandler);
  return app;
}

describe("photo upload", () => {
  it("rejects non-image files", async () => {
    const app = createUploadApp({
      Gallery: {},
      Photo: {},
      mediaService: {}
    });

    const response = await request(app)
      .post("/api/uploads")
      .field("galleryId", "507f1f77bcf86cd799439012")
      .attach("foto", Buffer.from("not-an-image"), {
        filename: "notes.txt",
        contentType: "text/plain"
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INVALID_IMAGE_TYPE");
  });

  it("uploads through the media service and stores provider metadata", async () => {
    const Photo = {
      create: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439013",
        evento: "Casamento",
        storageProvider: "cloudinary"
      })
    };
    const mediaService = {
      uploadImage: vi.fn().mockResolvedValue({
        url: "https://res.cloudinary.com/example/photo.jpg",
        sourceUrl: "https://res.cloudinary.com/example/photo.jpg",
        storageProvider: "cloudinary",
        providerAssetId: "photography/galleries/gallery-1/photo-1"
      })
    };
    const app = createUploadApp({
      Gallery: {
        findById: vi.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439012",
          title: "Casamento",
          eventType: "Evento",
          coverPhotoId: null,
          save: vi.fn()
        })
      },
      Photo,
      mediaService
    });

    const response = await request(app)
      .post("/api/uploads")
      .field("galleryId", "507f1f77bcf86cd799439012")
      .field("preco", "75")
      .attach("foto", Buffer.from("image-data"), {
        filename: "wedding.jpg",
        contentType: "image/jpeg"
      });

    expect(response.status).toBe(201);
    expect(mediaService.uploadImage).toHaveBeenCalledWith(
      expect.objectContaining({
        galleryId: "507f1f77bcf86cd799439012",
        filename: "wedding.jpg"
      })
    );
    expect(Photo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        preco: 75,
        storageProvider: "cloudinary",
        providerAssetId: "photography/galleries/gallery-1/photo-1"
      })
    );
  });
});
