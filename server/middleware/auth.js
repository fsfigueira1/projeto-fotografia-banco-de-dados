const UserModel = require("../../models/User");
const { getEnv } = require("../config/env");
const { sendError } = require("../http/response");
const { verifyToken } = require("../security");

const SESSION_COOKIE = "ff_session";

function createAuthMiddleware({ User = UserModel, env = null } = {}) {
  function runtimeEnv() {
    return env || getEnv();
  }

  async function requireAuth(req, res, next) {
    try {
      const token = req.cookies?.[SESSION_COOKIE];
      if (!token) {
        return sendError(res, {
          status: 401,
          message: "Autenticação obrigatória.",
          error: "AUTH_REQUIRED"
        });
      }

      const payload = verifyToken(token, runtimeEnv());
      if (payload.kind !== "user") {
        throw new Error("invalid token kind");
      }

      const user = await User.findById(payload.sub);
      if (!user) {
        throw new Error("user not found");
      }

      req.user = user;
      req.auth = {
        sub: String(user._id),
        role: user.role,
        kind: "user"
      };
      return next();
    } catch {
      return sendError(res, {
        status: 401,
        message: "Sessão inválida ou expirada.",
        error: "INVALID_SESSION"
      });
    }
  }

  function requireAdmin(req, res, next) {
    if (!req.user) {
      return sendError(res, {
        status: 401,
        message: "Autenticação obrigatória.",
        error: "AUTH_REQUIRED"
      });
    }

    if (req.user.role !== "admin") {
      return sendError(res, {
        status: 403,
        message: "Acesso restrito ao administrador.",
        error: "ADMIN_REQUIRED"
      });
    }

    return next();
  }

  return {
    requireAdmin,
    requireAuth
  };
}

let defaultMiddleware = null;

function getDefaultMiddleware() {
  if (!defaultMiddleware) {
    defaultMiddleware = createAuthMiddleware();
  }
  return defaultMiddleware;
}

module.exports = {
  SESSION_COOKIE,
  createAuthMiddleware,
  requireAdmin(req, res, next) {
    return getDefaultMiddleware().requireAdmin(req, res, next);
  },
  requireAuth(req, res, next) {
    return getDefaultMiddleware().requireAuth(req, res, next);
  }
};
