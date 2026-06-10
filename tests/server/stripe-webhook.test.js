const express = require("express");
const request = require("supertest");

const { errorHandler } = require("../../server/middleware/errors");

function createWebhookApp(webhookService) {
  const { createStripeWebhookRouter } = require("../../routes/webhook");
  const app = express();
  app.use(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    createStripeWebhookRouter({ webhookService })
  );
  app.use(errorHandler);
  return app;
}

describe("Stripe webhook", () => {
  it("rejects requests without a Stripe signature", async () => {
    const app = createWebhookApp({
      constructEvent: vi.fn(),
      handleEvent: vi.fn()
    });

    const response = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ type: "checkout.session.completed" }));

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("WEBHOOK_SIGNATURE_REQUIRED");
  });

  it("rejects invalid signatures", async () => {
    const app = createWebhookApp({
      constructEvent() {
        throw new Error("invalid signature");
      },
      handleEvent: vi.fn()
    });

    const response = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "invalid")
      .send(JSON.stringify({ type: "checkout.session.completed" }));

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("WEBHOOK_SIGNATURE_INVALID");
  });

  it("constructs and handles a signed event", async () => {
    const event = { id: "evt_1", type: "checkout.session.completed" };
    const webhookService = {
      constructEvent: vi.fn().mockReturnValue(event),
      handleEvent: vi.fn().mockResolvedValue({ handled: true })
    };
    const app = createWebhookApp(webhookService);

    const response = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "valid")
      .send(JSON.stringify(event));

    expect(response.status).toBe(200);
    expect(webhookService.constructEvent).toHaveBeenCalledWith(
      expect.any(Buffer),
      "valid"
    );
    expect(webhookService.handleEvent).toHaveBeenCalledWith(event);
  });
});

describe("Stripe webhook service", () => {
  it.each([
    ["checkout.session.completed", "paid", "paidAt"],
    ["checkout.session.async_payment_succeeded", "paid", "paidAt"],
    ["checkout.session.async_payment_failed", "failed", "failedAt"],
    ["checkout.session.expired", "canceled", "canceledAt"]
  ])("maps %s to %s", async (eventType, status, timestampField) => {
    const Purchase = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ _id: "purchase-1" })
    };
    const { createStripeWebhookService } = require("../../server/services/stripe-webhook");
    const service = createStripeWebhookService({
      stripe: { webhooks: { constructEvent: vi.fn() } },
      Purchase,
      webhookSecret: "whsec_test"
    });

    await service.handleEvent({
      type: eventType,
      data: {
        object: {
          id: "cs_1",
          payment_status: "paid",
          payment_intent: "pi_1"
        }
      }
    });

    expect(Purchase.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "cs_1" }),
      expect.objectContaining({
        status,
        [timestampField]: expect.any(Date)
      }),
      { new: true }
    );
  });
});
