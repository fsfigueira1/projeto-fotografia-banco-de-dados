const express = require("express");
const request = require("supertest");

const TEST_ENV = {
  JWT_SECRET: "a-secure-secret-with-at-least-thirty-two-characters",
  GALLERY_SESSION_EXPIRES_IN: "8h"
};

function createApp() {
  const { createGallerySessionMiddleware } = require("../../server/security");
  const app = express();
  const requireGallerySession = createGallerySessionMiddleware(TEST_ENV);

  app.get("/private", requireGallerySession, (req, res) => {
    res.json({ galleryId: req.gallerySession.galleryId });
  });
  return app;
}

describe("gallery session middleware", () => {
  it("accepts a scoped gallery token from the header", async () => {
    const { signGalleryToken } = require("../../server/security");
    const token = signGalleryToken({ galleryId: "gallery-1" }, TEST_ENV);

    const response = await request(createApp())
      .get("/private")
      .set("x-gallery-token", token);

    expect(response.status).toBe(200);
    expect(response.body.galleryId).toBe("gallery-1");
  });

  it("rejects gallery tokens passed through the query string", async () => {
    const { signGalleryToken } = require("../../server/security");
    const token = signGalleryToken({ galleryId: "gallery-1" }, TEST_ENV);

    const response = await request(createApp())
      .get(`/private?token=${encodeURIComponent(token)}`);

    expect(response.status).toBe(401);
  });
});
