const express = require("express");
const { z } = require("zod");

const PurchaseModel = require("../models/Compra");
const { sendError, sendSuccess } = require("../server/http/response");
const { requireAuth: defaultRequireAuth } = require("../server/middleware/auth");
const { validate } = require("../server/middleware/validate");
const { createPurchaseService } = require("../server/services/purchases");
const { createOptionalGallerySessionMiddleware } = require("../server/security");

const checkoutSchema = z
  .object({
    photoIds: z.array(z.string().trim().min(1)).max(100).optional(),
    fotoId: z.string().trim().min(1).optional(),
    serviceId: z.string().trim().min(1).optional(),
    paymentMethod: z.enum(["card", "pix", "boleto"]).default("card")
  })
  .refine(
    (input) => input.serviceId || input.fotoId || input.photoIds?.length,
    "Selecione fotos ou um serviço."
  )
  .transform((input) => ({
    photoIds: input.photoIds?.length
      ? input.photoIds
      : input.fotoId
        ? [input.fotoId]
        : undefined,
    serviceId: input.serviceId,
    paymentMethod: input.paymentMethod
  }));

function serializePurchase(purchase) {
  return {
    _id: String(purchase._id),
    type: purchase.type,
    total: purchase.total,
    currency: purchase.currency,
    status: purchase.status,
    sessionId: purchase.sessionId,
    createdAt: purchase.createdAt || null,
    paidAt: purchase.paidAt || null
  };
}

function createPaymentRouter({
  purchaseService = null,
  Purchase = PurchaseModel,
  requireAuth = defaultRequireAuth,
  readGallerySession = createOptionalGallerySessionMiddleware()
} = {}) {
  const router = express.Router();
  const getPurchaseService = () => purchaseService || createPurchaseService();

  const checkoutHandler = async (req, res, next) => {
    try {
      const result = await getPurchaseService().createCheckout({
        userId: String(req.user._id),
        gallerySession: req.gallerySession,
        photoIds: req.body.photoIds,
        serviceId: req.body.serviceId,
        paymentMethod: req.body.paymentMethod
      });

      return sendSuccess(res, {
        status: 201,
        data: {
          purchase: serializePurchase(result.purchase),
          checkoutUrl: result.checkoutUrl,
          url: result.checkoutUrl
        },
        message: "Checkout criado com sucesso."
      });
    } catch (error) {
      return next(error);
    }
  };

  router.post(
    "/checkout",
    requireAuth,
    readGallerySession,
    validate({ body: checkoutSchema }),
    checkoutHandler
  );

  router.post(
    "/criar-checkout",
    requireAuth,
    readGallerySession,
    validate({ body: checkoutSchema }),
    checkoutHandler
  );

  router.get("/:id", requireAuth, async (req, res, next) => {
    try {
      const purchase = await Purchase.findOne({
        _id: req.params.id,
        userId: req.user._id
      });
      if (!purchase) {
        return sendError(res, {
          status: 404,
          message: "Compra não encontrada.",
          error: "PURCHASE_NOT_FOUND"
        });
      }

      return sendSuccess(res, {
        data: { purchase: serializePurchase(purchase) },
        message: "Status da compra carregado."
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createPaymentRouter();
module.exports.createPaymentRouter = createPaymentRouter;
module.exports.serializePurchase = serializePurchase;
