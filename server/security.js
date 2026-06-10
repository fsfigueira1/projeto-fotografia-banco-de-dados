const jwt = require("jsonwebtoken");
const { getEnv } = require("./config/env");
const { sendError } = require("./http/response");

function resolveEnv(env) {
  return env || getEnv();
}

function signUserToken(user, env) {
  const runtime = resolveEnv(env);
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role || "client",
      kind: "user"
    },
    runtime.JWT_SECRET,
    { expiresIn: runtime.JWT_EXPIRES_IN }
  );
}

function signGalleryToken(payload, env) {
  const runtime = resolveEnv(env);
  return jwt.sign(
    {
      ...payload,
      kind: "gallery"
    },
    runtime.JWT_SECRET,
    { expiresIn: runtime.GALLERY_SESSION_EXPIRES_IN }
  );
}

function verifyToken(token, env) {
  return jwt.verify(token, resolveEnv(env).JWT_SECRET);
}

function parseDurationMs(value) {
  const match = /^(\d+)(s|m|h|d)$/i.exec(String(value || ""));
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return amount * multipliers[match[2].toLowerCase()];
}

function getSessionCookieOptions(env) {
  const runtime = resolveEnv(env);
  const production = runtime.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    path: "/",
    maxAge: parseDurationMs(runtime.JWT_EXPIRES_IN),
    ...(runtime.COOKIE_DOMAIN ? { domain: runtime.COOKIE_DOMAIN } : {})
  };
}

function getClearCookieOptions(env) {
  const { maxAge: _maxAge, ...options } = getSessionCookieOptions(env);
  return options;
}

function createGallerySessionMiddleware(env = null) {
  return function requireGallerySession(req, res, next) {
    try {
      const token = req.headers["x-gallery-token"];
      if (!token) {
        return sendError(res, {
          status: 401,
          message: "Código de acesso da galeria obrigatório.",
          error: "GALLERY_SESSION_REQUIRED"
        });
      }

      const payload = verifyToken(String(token), env);
      if (payload.kind !== "gallery" || !payload.galleryId) {
        throw new Error("invalid gallery token");
      }

      req.gallerySession = payload;
      return next();
    } catch {
      return sendError(res, {
        status: 401,
        message: "Sessão da galeria inválida ou expirada.",
        error: "INVALID_GALLERY_SESSION"
      });
    }
  };
}

function createOptionalGallerySessionMiddleware(env = null) {
  return function readGallerySession(req, res, next) {
    if (!req.headers["x-gallery-token"]) {
      return next();
    }
    return createGallerySessionMiddleware(env)(req, res, next);
  };
}

let defaultGalleryMiddleware = null;

function requireGallerySession(req, res, next) {
  if (!defaultGalleryMiddleware) {
    defaultGalleryMiddleware = createGallerySessionMiddleware();
  }
  return defaultGalleryMiddleware(req, res, next);
}

function requireAuth(req, res, next) {
  return require("./middleware/auth").requireAuth(req, res, next);
}

function requireAdmin(req, res, next) {
  return require("./middleware/auth").requireAdmin(req, res, next);
}

module.exports = {
  createGallerySessionMiddleware,
  createOptionalGallerySessionMiddleware,
  getClearCookieOptions,
  getSessionCookieOptions,
  parseDurationMs,
  requireAdmin,
  requireAuth,
  requireGallerySession,
  signGalleryToken,
  signUserToken,
  verifyToken
};
