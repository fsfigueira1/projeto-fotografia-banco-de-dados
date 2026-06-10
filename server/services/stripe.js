const Stripe = require("stripe");
const { getEnv } = require("../config/env");

let stripeClient = null;

function getStripeClient(env = null) {
  if (stripeClient) return stripeClient;
  const runtime = env || getEnv();
  if (!runtime.STRIPE_SECRET_KEY) {
    const error = new Error("Stripe não está configurado.");
    error.status = 503;
    error.code = "STRIPE_NOT_CONFIGURED";
    throw error;
  }
  stripeClient = new Stripe(runtime.STRIPE_SECRET_KEY);
  return stripeClient;
}

function resetStripeClient() {
  stripeClient = null;
}

module.exports = {
  getStripeClient,
  resetStripeClient
};
