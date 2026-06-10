function createDependencies(photos) {
  const createdPurchases = [];
  const createdSessions = [];
  return {
    Photo: {
      async find() {
        return photos;
      }
    },
    Purchase: {
      async findOne() {
        return null;
      },
      async create(input) {
        createdPurchases.push(input);
        return { _id: "purchase-1", ...input };
      }
    },
    stripe: {
      checkout: {
        sessions: {
          async create(input) {
            createdSessions.push(input);
            return {
              id: "cs_test_1",
              url: "https://checkout.stripe.test/session"
            };
          }
        }
      }
    },
    env: {
      FRONTEND_URLS: ["https://gallery.example.com"]
    },
    createdPurchases,
    createdSessions
  };
}

describe("purchase service", () => {
  it("calculates photo totals from database prices", async () => {
    const dependencies = createDependencies([
      { _id: "photo-1", galleryId: "gallery-1", preco: 40 },
      { _id: "photo-2", galleryId: "gallery-1", preco: 60 }
    ]);
    const { createPurchaseService } = require("../../server/services/purchases");
    const service = createPurchaseService(dependencies);

    const result = await service.createCheckout({
      userId: "user-1",
      gallerySession: { galleryId: "gallery-1", accessCodeId: "code-1" },
      photoIds: ["photo-1", "photo-2"],
      frontendTotal: 1,
      paymentMethod: "card"
    });

    expect(result.purchase.total).toBe(100);
    expect(dependencies.createdSessions[0].line_items[0].price_data.unit_amount).toBe(10000);
  });

  it("rejects duplicate photo identifiers", async () => {
    const dependencies = createDependencies([]);
    const { createPurchaseService } = require("../../server/services/purchases");
    const service = createPurchaseService(dependencies);

    await expect(
      service.createCheckout({
        userId: "user-1",
        gallerySession: { galleryId: "gallery-1" },
        photoIds: ["photo-1", "photo-1"]
      })
    ).rejects.toMatchObject({ code: "DUPLICATE_PHOTO_IDS" });
  });

  it("rejects photos outside the authorized gallery", async () => {
    const dependencies = createDependencies([
      { _id: "photo-1", galleryId: "gallery-2", preco: 40 }
    ]);
    const { createPurchaseService } = require("../../server/services/purchases");
    const service = createPurchaseService(dependencies);

    await expect(
      service.createCheckout({
        userId: "user-1",
        gallerySession: { galleryId: "gallery-1" },
        photoIds: ["photo-1"]
      })
    ).rejects.toMatchObject({ code: "PHOTO_NOT_AUTHORIZED" });
  });

  it("creates service checkout from the server catalog", async () => {
    const dependencies = createDependencies([]);
    const { createPurchaseService } = require("../../server/services/purchases");
    const service = createPurchaseService(dependencies);

    const result = await service.createCheckout({
      userId: "user-1",
      serviceId: "casamento",
      paymentMethod: "pix"
    });

    expect(result.purchase.total).toBe(1800);
    expect(dependencies.createdSessions[0].payment_method_types).toEqual(["pix"]);
  });
});
