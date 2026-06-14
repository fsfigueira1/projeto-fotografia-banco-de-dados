const PurchaseModel = require("../../models/Compra");
const PhotoModel = require("../../models/Foto");
const { getEnv } = require("../config/env");
const { getStripeClient } = require("./stripe");

const SERVICES = Object.freeze({
  casamento: { name: "Pacote Casamento", price: 1800 },
  aniversario: { name: "Pacote Aniversário", price: 1200 },
  formatura: { name: "Pacote Formatura", price: 1500 },
  corporativo: { name: "Pacote Corporativo", price: 900 }
});

function createServiceError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function normalizePaymentMethod(value) {
  const method = String(value || "card").toLowerCase();
  return ["card", "pix", "boleto"].includes(method) ? method : "card";
}

function createPurchaseService({
  Photo = PhotoModel,
  Purchase = PurchaseModel,
  stripe = getStripeClient(),
  env = getEnv()
} = {}) {
  async function preparePhotoCheckout(input) {
    if (!input.gallerySession?.galleryId) {
      throw createServiceError(
        "Acesso à galeria obrigatório para comprar fotos.",
        401,
        "GALLERY_SESSION_REQUIRED"
      );
    }

    const photoIds = Array.isArray(input.photoIds)
      ? input.photoIds.map(String)
      : [];
    if (!photoIds.length) {
      throw createServiceError(
        "Selecione pelo menos uma foto.",
        400,
        "PHOTO_SELECTION_REQUIRED"
      );
    }

    if (new Set(photoIds).size !== photoIds.length) {
      throw createServiceError(
        "A seleção contém fotos duplicadas.",
        400,
        "DUPLICATE_PHOTO_IDS"
      );
    }

    const photos = await Photo.find({ _id: { $in: photoIds } });
    if (photos.length !== photoIds.length) {
      throw createServiceError(
        "Uma ou mais fotos não foram encontradas.",
        404,
        "PHOTOS_NOT_FOUND"
      );
    }

    const galleryId = String(input.gallerySession.galleryId);
    if (photos.some((photo) => String(photo.galleryId) !== galleryId)) {
      throw createServiceError(
        "Uma ou mais fotos não pertencem à galeria autorizada.",
        403,
        "PHOTO_NOT_AUTHORIZED"
      );
    }

    const alreadyPurchased = await Purchase.findOne({
      userId: input.userId,
      status: "paid",
      photoIds: { $in: photoIds }
    });
    if (alreadyPurchased) {
      throw createServiceError(
        "Uma ou mais fotos já foram compradas.",
        409,
        "PHOTO_ALREADY_PURCHASED"
      );
    }

    const total = photos.reduce(
      (sum, photo) => sum + Number(photo.preco || 0),
      0
    );
    return {
      total,
      type: "photo",
      productName: `Fotos selecionadas - ${photos.length} itens`,
      photoIds,
      galleryId,
      accessCodeId: input.gallerySession.accessCodeId
        ? String(input.gallerySession.accessCodeId)
        : null
    };
  }

  function prepareServiceCheckout(input) {
    const service = SERVICES[String(input.serviceId || "")];
    if (!service) {
      throw createServiceError(
        "Serviço não encontrado.",
        404,
        "SERVICE_NOT_FOUND"
      );
    }

    return {
      total: service.price,
      type: "service",
      productName: service.name,
      serviceId: String(input.serviceId),
      photoIds: [],
      galleryId: null,
      accessCodeId: null
    };
  }

  async function createCheckout(input) {
    const prepared = input.serviceId
      ? prepareServiceCheckout(input)
      : await preparePhotoCheckout(input);
    const paymentMethod = normalizePaymentMethod(input.paymentMethod);
    const frontendUrl = (
      env.CLIENT_ORIGINS ||
      env.FRONTEND_URLS ||
      []
    )[0].replace(/\/+$/, "");

    const metadata = {
      userId: String(input.userId),
      type: prepared.type
    };
    if (prepared.serviceId) metadata.serviceId = prepared.serviceId;
    if (prepared.galleryId) metadata.galleryId = prepared.galleryId;
    if (prepared.accessCodeId) metadata.accessCodeId = prepared.accessCodeId;
    if (prepared.photoIds.length) metadata.photoIds = prepared.photoIds.join(",");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: [paymentMethod],
      mode: "payment",
      metadata,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: prepared.productName },
            unit_amount: Math.round(prepared.total * 100)
          },
          quantity: 1
        }
      ],
      success_url: `${frontendUrl}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cancelado.html?session_id={CHECKOUT_SESSION_ID}`
    });

    const purchase = await Purchase.create({
      userId: input.userId,
      photoIds: prepared.photoIds,
      serviceId: prepared.serviceId || "",
      galleryId: prepared.galleryId,
      accessCodeId: prepared.accessCodeId,
      type: prepared.type,
      paymentMethod,
      paymentProvider: "stripe",
      total: prepared.total,
      currency: "brl",
      pago: false,
      status: "pending",
      sessionId: session.id
    });

    return {
      purchase,
      checkoutUrl: session.url
    };
  }

  return {
    createCheckout
  };
}

module.exports = {
  SERVICES,
  createPurchaseService,
  createServiceError,
  normalizePaymentMethod
};
