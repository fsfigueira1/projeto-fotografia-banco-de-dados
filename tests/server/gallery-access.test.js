const bcrypt = require("bcrypt");
const express = require("express");
const request = require("supertest");

const AccessCode = require("../../models/AccessCode");
const Compra = require("../../models/Compra");
const Foto = require("../../models/Foto");
const Gallery = require("../../models/Gallery");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/galerias", require("../../routes/galerias"));
  return app;
}

function mockActiveCodes(codes) {
  return vi.spyOn(AccessCode, "find").mockReturnValue({
    sort: vi.fn().mockResolvedValue(codes)
  });
}

function mockGalleryPhotos(photos) {
  return vi.spyOn(Foto, "find").mockReturnValue({
    sort: vi.fn().mockResolvedValue(photos)
  });
}

describe("gallery access route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens a valid empty gallery and returns paid purchases", async () => {
    const accessCode = {
      _id: "code-1",
      galleryId: "gallery-1",
      codeHash: "hash",
      active: true,
      save: vi.fn().mockResolvedValue(undefined)
    };
    const gallery = {
      _id: "gallery-1",
      title: "Evento privado",
      slug: "evento-privado",
      status: "active"
    };
    const purchases = [
      { _id: "purchase-1", status: "paid", photoIds: ["photo-1"] }
    ];

    mockActiveCodes([accessCode]);
    vi.spyOn(bcrypt, "compare").mockResolvedValue(true);
    vi.spyOn(Gallery, "findById").mockResolvedValue(gallery);
    mockGalleryPhotos([]);
    vi.spyOn(Compra, "find").mockResolvedValue(purchases);

    const response = await request(createApp())
      .post("/api/galerias/acessar")
      .send({ code: "EVENTO1" });

    expect(response.status).toBe(200);
    expect(response.body.gallery.title).toBe("Evento privado");
    expect(response.body.photos).toEqual([]);
    expect(response.body.purchases).toEqual(purchases);
    expect(response.body.token).toEqual(expect.any(String));
  });

  it("returns a friendly error for an invalid code", async () => {
    mockActiveCodes([
      {
        _id: "code-1",
        galleryId: "gallery-1",
        codeHash: "hash",
        active: true
      }
    ]);
    vi.spyOn(bcrypt, "compare").mockResolvedValue(false);

    const response = await request(createApp())
      .post("/api/galerias/acessar")
      .send({ code: "INVALIDO" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Senha inválida ou expirada.");
  });
});
