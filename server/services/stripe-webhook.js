const PurchaseModel = require("../../models/Compra");
const { getEnv } = require("../config/env");
const { getStripeClient } = require("./stripe");

function createStripeWebhookService({
  stripe = getStripeClient(),
  Purchase = PurchaseModel,
  webhookSecret = getEnv().STRIPE_WEBHOOK_SECRET
} = {}) {
  function constructEvent(rawBody, signature) {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  }

  async function transitionPurchase(session, status, timestampField) {
    const update = {
      status,
      pago: status === "paid",
      paymentIntentId: session.payment_intent
        ? String(session.payment_intent)
        : ""
    };
    update[timestampField] = new Date();

    return Purchase.findOneAndUpdate(
      {
        sessionId: session.id,
        status: { $ne: status }
      },
      update,
      { new: true }
    );
  }

  async function handleEvent(event) {
    const session = event?.data?.object;
    if (!session?.id) return { handled: false };

    switch (event.type) {
      case "checkout.session.completed":
        if (session.payment_status !== "paid") {
          return { handled: false };
        }
        await transitionPurchase(session, "paid", "paidAt");
        return { handled: true };
      case "checkout.session.async_payment_succeeded":
        await transitionPurchase(session, "paid", "paidAt");
        return { handled: true };
      case "checkout.session.async_payment_failed":
        await transitionPurchase(session, "failed", "failedAt");
        return { handled: true };
      case "checkout.session.expired":
        await transitionPurchase(session, "canceled", "canceledAt");
        return { handled: true };
      default:
        return { handled: false };
    }
  }

  return {
    constructEvent,
    handleEvent
  };
}

module.exports = {
  createStripeWebhookService
};
