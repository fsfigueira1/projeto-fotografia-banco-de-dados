const express = require("express");

const { sendError, sendSuccess } = require("../server/http/response");
const { createStripeWebhookService } = require("../server/services/stripe-webhook");

function createStripeWebhookRouter({ webhookService = null } = {}) {
  const router = express.Router();
  const getWebhookService = () =>
    webhookService || createStripeWebhookService();

  router.post("/", async (req, res, next) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return sendError(res, {
        status: 400,
        message: "Assinatura Stripe obrigatória.",
        error: "WEBHOOK_SIGNATURE_REQUIRED"
      });
    }

    let event;
    try {
      event = getWebhookService().constructEvent(req.body, signature);
    } catch {
      return sendError(res, {
        status: 400,
        message: "Assinatura Stripe inválida.",
        error: "WEBHOOK_SIGNATURE_INVALID"
      });
    }

    try {
      const result = await getWebhookService().handleEvent(event);
      return sendSuccess(res, {
        data: {
          received: true,
          handled: Boolean(result?.handled)
        },
        message: "Webhook recebido."
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createStripeWebhookRouter();
module.exports.createStripeWebhookRouter = createStripeWebhookRouter;
