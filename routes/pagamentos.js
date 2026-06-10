const express = require("express");
const router = express.Router();

const Stripe = require("stripe");
const { getEnv } = require("../server/config/env");

const Compra = require("../models/Compra");
const Foto = require("../models/Foto");

let stripe = null;

function getStripe() {
  if (stripe) return stripe;
  const key = getEnv().STRIPE_SECRET_KEY;
  if (!key) {
    const error = new Error("Stripe não está configurado.");
    error.status = 503;
    error.code = "STRIPE_NOT_CONFIGURED";
    throw error;
  }
  stripe = Stripe(key);
  return stripe;
}

const SERVICOS = {
  casamento: { nome: "Pacote Casamento", preco: 1800 },
  aniversario: { nome: "Pacote Aniversário", preco: 1200 },
  formatura: { nome: "Pacote Formatura", preco: 1500 },
  corporativo: { nome: "Pacote Corporativo", preco: 900 }
};

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

    const frontendUrl = getEnv().FRONTEND_URLS[0];
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      mode: "payment",
      metadata,
      line_items: [lineItem],
      success_url: `${frontendUrl}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cancelado.html?session_id={CHECKOUT_SESSION_ID}`
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

module.exports = router;
