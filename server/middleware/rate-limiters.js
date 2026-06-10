const rateLimit = require("express-rate-limit");
const { sendError } = require("../http/response");

function createLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler(_req, res) {
      return sendError(res, {
        status: 429,
        message: "Muitas tentativas. Aguarde e tente novamente.",
        error: "RATE_LIMITED"
      });
    }
  });
}

const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 500
});

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20
});

const galleryAccessLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30
});

module.exports = {
  authLimiter,
  galleryAccessLimiter,
  globalLimiter
};
