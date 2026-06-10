const express = require("express");
const router = express.Router();

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_51TeznFKdPtDysEm0UfBNACV0Qrit2zrLNP7KaGQiXc9dQtylueUtwJUeKpkWmbHMVnNjxKlUxjKozM8m2UIbdfdz00xkxL5nDl");

const Compra = require("../models/Compra");
const Foto = require("../models/Foto");
const Gallery = require("../models/Gallery");
const AccessCode = require("../models/AccessCode");

const SERVICOS = {
  casamento: { nome: "Pacote Casamento", preco: 1800 },
  aniversario: { nome: "Pacote Aniversário", preco: 1200 },
  formatura: { nome: "Pacote Formatura", preco: 1500 },
  corporativo: { nome: "Pacote Corporativo", preco: 900 }
};

async function marcarCompraComoPaga(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    throw new Error("Pagamento ainda nao confirmado.");
  }

  const purchase = await Compra.findOneAndUpdate(
    { sessionId },
    {
      pago: true,
      status: "paid",
      userId: session.metadata?.userId || undefined,
      fotoId: session.metadata?.fotoId || undefined,
      photoIds: session.metadata?.photoIds ? session.metadata.photoIds.split(",") : undefined,
      serviceId: session.metadata?.serviceId || undefined,
      galleryId: session.metadata?.galleryId || undefined,
      accessCodeId: session.metadata?.accessCodeId || undefined
    },
    { new: true }
  );

  if (purchase?.accessCodeId) {
    await AccessCode.findByIdAndUpdate(purchase.accessCodeId, {
      active: true,
      lastUsedAt: new Date()
    });
  }

  return session;
}

router.post("/criar-checkout", async (req, res) => {
  try {
    const { fotoId, photoIds, serviceId, userId, paymentMethod, paymentProvider, galleryId, accessCodeId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId e obrigatorio." });
    }

    const normalizedMethod = String(paymentMethod || "card").toLowerCase();
    const paymentMethodTypes =
      normalizedMethod === "pix"
        ? ["pix"]
        : normalizedMethod === "boleto"
          ? ["boleto"]
          : ["card"];

    let lineItem = null;
    let metadata = { userId: String(userId) };
    let purchaseType = "photo";
    let total = 0;
    let resolvedPhotoIds = [];

    if (serviceId) {
      const service = SERVICOS[String(serviceId)];
      if (!service) {
        return res.status(404).json({ error: "Serviço nao encontrado." });
      }

      total = Number(service.preco || 0);
      lineItem = {
        price_data: {
          currency: "brl",
          product_data: { name: service.nome },
          unit_amount: Math.round(total * 100)
        },
        quantity: 1
      };

      metadata = {
        ...metadata,
        serviceId: String(serviceId),
        galleryId: galleryId ? String(galleryId) : undefined,
        accessCodeId: accessCodeId ? String(accessCodeId) : undefined,
        type: "service"
      };
      purchaseType = "service";
    } else {
      resolvedPhotoIds = Array.isArray(photoIds) && photoIds.length ? photoIds : fotoId ? [fotoId] : [];
      if (!resolvedPhotoIds.length) {
        return res.status(400).json({ error: "fotoId ou photoIds sao obrigatorios." });
      }

      const fotos = await Foto.find({ _id: { $in: resolvedPhotoIds } });
      if (!fotos.length) {
        return res.status(404).json({ error: "Fotos nao encontradas." });
      }

      total = fotos.reduce((sum, foto) => sum + Number(foto.preco || 50), 0);
      lineItem = {
        price_data: {
          currency: "brl",
          product_data: {
            name: `Fotos selecionadas - ${fotos.length} itens`
          },
          unit_amount: Math.round(total * 100)
        },
        quantity: 1
      };

      metadata = {
        ...metadata,
        fotoId: resolvedPhotoIds[0],
        photoIds: resolvedPhotoIds.join(","),
        galleryId: galleryId ? String(galleryId) : undefined,
        accessCodeId: accessCodeId ? String(accessCodeId) : undefined,
        type: "photo"
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      mode: "payment",
      metadata,
      line_items: [lineItem],
      success_url: "http://localhost:3000/sucesso.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/cancelado.html?session_id={CHECKOUT_SESSION_ID}"
    });

    await Compra.create({
      userId,
      fotoId: fotoId || undefined,
      photoIds: resolvedPhotoIds,
      serviceId: serviceId || undefined,
      galleryId: galleryId || undefined,
      accessCodeId: accessCodeId || undefined,
      type: purchaseType,
      paymentMethod: normalizedMethod,
      paymentProvider: String(paymentProvider || "stripe").toLowerCase(),
      total,
      pago: false,
      status: "pending",
      sessionId: session.id
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nao foi possivel iniciar o checkout." });
  }
});

router.get("/confirmar", async (req, res) => {
  try {
    const { session_id: sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: "session_id e obrigatorio." });
    }

    const session = await marcarCompraComoPaga(sessionId);
    res.json({
      ok: true,
      sessionId,
      userId: session.metadata?.userId || null,
      fotoId: session.metadata?.fotoId || null,
      photoIds: session.metadata?.photoIds || null,
      serviceId: session.metadata?.serviceId || null,
      galleryId: session.metadata?.galleryId || null
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || "Nao foi possivel confirmar o pagamento." });
  }
});

module.exports = router;
