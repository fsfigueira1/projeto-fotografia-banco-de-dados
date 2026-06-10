const express = require("express");
const router = express.Router();

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_51TeznFKdPtDysEm0UfBNACV0Qrit2zrLNP7KaGQiXc9dQtylueUtwJUeKpkWmbHMVnNjxKlUxjKozM8m2UIbdfdz00xkxL5nDl");

const Compra = require("../models/Compra");
const AccessCode = require("../models/AccessCode");

router.post("/", express.json(), async (req, res) => {
  try {
    const event = req.body;

    if (event?.type === "checkout.session.completed") {
      const session = event.data.object;
      const fullSession = await stripe.checkout.sessions.retrieve(session.id);

      const purchase = await Compra.findOneAndUpdate(
        { sessionId: session.id },
        {
          pago: true,
          status: "paid",
          userId: fullSession.metadata?.userId || undefined,
          fotoId: fullSession.metadata?.fotoId || undefined,
          photoIds: fullSession.metadata?.photoIds ? fullSession.metadata.photoIds.split(",") : undefined,
          serviceId: fullSession.metadata?.serviceId || undefined,
          galleryId: fullSession.metadata?.galleryId || undefined,
          accessCodeId: fullSession.metadata?.accessCodeId || undefined
        },
        { new: true }
      );

      if (purchase?.accessCodeId) {
        await AccessCode.findByIdAndUpdate(purchase.accessCodeId, {
          active: true,
          lastUsedAt: new Date()
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = router;
