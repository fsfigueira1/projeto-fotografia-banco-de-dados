const express = require("express");
const request = require("supertest");

const { errorHandler } = require("../../server/middleware/errors");
const { sendError } = require("../../server/http/response");

function createTestApp({ service, Purchase = {} }) {
  const { createPaymentRouter } = require("../../routes/pagamentos");
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
    req.user = { _id: userId, role: "client" };
    return next();
  };

  const readGallerySession = (req, _res, next) => {
    const galleryId = req.headers["x-test-gallery"];
    if (galleryId) {
      req.gallerySession = {
        galleryId,
        accessCodeId: "code-1"
      };
    }
    return next();
  };

  app.use(express.json());
  app.use(
    "/api/payments",
    createPaymentRouter({
      purchaseService: service,
      Purchase,
      requireAuth,
      readGallerySession
    })
  );
  app.use(errorHandler);
  return app;
}

describe("payment routes", () => {
  it("requires authentication for checkout", async () => {
    const app = createTestApp({
      service: { createCheckout: vi.fn() }
    });

    const response = await request(app)
      .post("/api/payments/checkout")
      .send({ serviceId: "casamento" });

    expect(response.status).toBe(401);
  });

  it("rejects checkout with an empty cart", async () => {
    const service = {
      createCheckout: vi.fn()
    };
    const app = createTestApp({ service });

    const response = await request(app)
      .post("/api/payments/checkout")
      .set("x-test-user", "trusted-user")
      .send({});

    expect(response.status).toBe(400);
    expect(service.createCheckout).not.toHaveBeenCalled();
  });

  it("passes the authenticated user and scoped gallery to the service", async () => {
    const createCheckout = vi.fn().mockResolvedValue({
      purchase: { _id: "purchase-1", total: 100, status: "pending" },
      checkoutUrl: "https://checkout.stripe.test/session"
    });
    const app = createTestApp({
      service: { createCheckout }
    });

    const response = await request(app)
      .post("/api/payments/checkout")
      .set("x-test-user", "trusted-user")
      .set("x-test-gallery", "gallery-1")
      .send({
        userId: "attacker-user",
        photoIds: ["photo-1"],
        total: 1,
        paymentMethod: "card"
      });

    expect(response.status).toBe(201);
    expect(createCheckout).toHaveBeenCalledWith({
      userId: "trusted-user",
      gallerySession: {
        galleryId: "gallery-1",
        accessCodeId: "code-1"
      },
      photoIds: ["photo-1"],
      serviceId: undefined,
      paymentMethod: "card"
    });
    expect(response.body.data.checkoutUrl).toContain("stripe.test");
  });

  it("returns an authenticated purchase status without mutating it", async () => {
    const Purchase = {
      findOne: vi.fn().mockResolvedValue({
        _id: "purchase-1",
        userId: "trusted-user",
        status: "pending",
        total: 100
      })
    };
    const app = createTestApp({
      service: { createCheckout: vi.fn() },
      Purchase
    });

    const response = await request(app)
      .get("/api/payments/purchase-1")
      .set("x-test-user", "trusted-user");

    expect(response.status).toBe(200);
    expect(Purchase.findOne).toHaveBeenCalledWith({
      _id: "purchase-1",
      userId: "trusted-user"
    });
    expect(response.body.data.purchase.status).toBe("pending");
  });

  it("returns a clear service error when Stripe is not configured", async () => {
    const error = Object.assign(
      new Error("Stripe não está configurado."),
      {
        status: 503,
        code: "STRIPE_NOT_CONFIGURED",
        expose: true
      }
    );
    const app = createTestApp({
      service: {
        createCheckout: vi.fn().mockRejectedValue(error)
      }
    });

    const response = await request(app)
      .post("/api/payments/checkout")
      .set("x-test-user", "trusted-user")
      .send({ serviceId: "casamento" });

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("STRIPE_NOT_CONFIGURED");
    expect(response.body.message).toBe("Stripe não está configurado.");
  });
});
