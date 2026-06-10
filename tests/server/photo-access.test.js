const express = require("express");
const request = require("supertest");

const { errorHandler } = require("../../server/middleware/errors");
const { sendError } = require("../../server/http/response");

function createPhotoApp({ Purchase, Photo }) {
  const { createPhotoRouter } = require("../../routes/fotos");
  const app = express();
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
    return next();
  };

  app.use(
    "/api/photos",
    createPhotoRouter({
      Purchase,
      Photo,
      requireAuth,
      requireGallerySession: (_req, _res, next) => next()
    })
  );
  app.use(errorHandler);
  return app;
}

describe("purchased photo access", () => {
  it("requires authentication", async () => {
    const app = createPhotoApp({ Purchase: {}, Photo: {} });

    const response = await request(app).get("/api/photos/purchased");

    expect(response.status).toBe(401);
  });

  it("loads only paid purchases for the authenticated user", async () => {
    const Purchase = {
      find: vi.fn().mockResolvedValue([
        { photoIds: ["photo-1", "photo-2"] }
      ])
    };
    const Photo = {
      find: vi.fn().mockResolvedValue([
        { _id: "photo-1" },
        { _id: "photo-2" }
      ])
    };
    const app = createPhotoApp({ Purchase, Photo });

    const response = await request(app)
      .get("/api/photos/purchased")
      .set("x-test-user", "trusted-user");

    expect(response.status).toBe(200);
    expect(Purchase.find).toHaveBeenCalledWith({
      userId: "trusted-user",
      status: "paid"
    });
    expect(response.body.data.photos).toHaveLength(2);
  });

  it("builds a gallery purchase filter scoped to the access code", () => {
    const { buildGalleryPurchaseFilter } = require("../../routes/galerias");

    expect(
      buildGalleryPurchaseFilter({
        galleryId: "gallery-1",
        accessCodeId: "code-1"
      })
    ).toEqual({
      galleryId: "gallery-1",
      accessCodeId: "code-1",
      status: "paid"
    });
  });
});
