const mongoose = require("mongoose");

const AccessCode = require("../../models/AccessCode");
const Compra = require("../../models/Compra");
const Foto = require("../../models/Foto");
const Gallery = require("../../models/Gallery");

const objectId = () => new mongoose.Types.ObjectId();

describe("domain model validation", () => {
  it("requires gallery ownership and a valid status", () => {
    const invalid = new Gallery({ title: "Evento", slug: "evento", status: "unknown" });
    const valid = new Gallery({
      title: "Evento",
      slug: "evento",
      status: "active",
      createdBy: objectId()
    });

    expect(invalid.validateSync()).toBeTruthy();
    expect(valid.validateSync()).toBeUndefined();
  });

  it("requires an access-code gallery and creator", () => {
    const invalid = new AccessCode({ codeHash: "hash" });
    const valid = new AccessCode({
      galleryId: objectId(),
      codeHash: "hash",
      createdBy: objectId()
    });

    expect(invalid.validateSync()).toBeTruthy();
    expect(valid.validateSync()).toBeUndefined();
  });

  it("rejects photos with a negative price", () => {
    const photo = new Foto({
      url: "https://example.com/photo.jpg",
      galleryId: objectId(),
      userId: objectId(),
      preco: -1
    });

    expect(photo.validateSync()?.errors.preco).toBeTruthy();
  });

  it("accepts all supported purchase states and rejects unknown states", () => {
    for (const status of ["pending", "paid", "failed", "canceled"]) {
      const purchase = new Compra({
        userId: objectId(),
        type: "photo",
        total: 100,
        currency: "brl",
        sessionId: `session-${status}`,
        status
      });
      expect(purchase.validateSync()).toBeUndefined();
    }

    const invalid = new Compra({
      userId: objectId(),
      type: "photo",
      total: 100,
      currency: "brl",
      sessionId: "session-invalid",
      status: "unknown"
    });
    expect(invalid.validateSync()?.errors.status).toBeTruthy();
  });

  it("rejects negative purchase totals and enables timestamps", () => {
    const purchase = new Compra({
      userId: objectId(),
      type: "photo",
      total: -10,
      currency: "brl",
      sessionId: "session-negative"
    });

    expect(purchase.validateSync()?.errors.total).toBeTruthy();
    expect(Compra.schema.options.timestamps).toBe(true);
  });
});
