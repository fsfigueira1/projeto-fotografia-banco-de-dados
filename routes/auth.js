const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");

const UserModel = require("../models/User");
const { getEnv } = require("../server/config/env");
const { sendError, sendSuccess } = require("../server/http/response");
const { createAuthMiddleware, SESSION_COOKIE } = require("../server/middleware/auth");
const { validate } = require("../server/middleware/validate");
const {
  getClearCookieOptions,
  getSessionCookieOptions,
  signUserToken
} = require("../server/security");

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um email válido."),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128)
});

const registerSchema = credentialsSchema.extend({
  nome: z.string().trim().min(2, "Informe seu nome.").max(120)
});

function sanitizeUser(user) {
  return {
    _id: String(user._id),
    nome: user.nome,
    email: user.email,
    role: user.role || "client"
  };
}

async function resolvePasswordUser(User, email) {
  const query = User.findOne({ email });
  if (query && typeof query.select === "function") {
    return query.select("+senha");
  }
  return query;
}

function createAuthRouter({ User = UserModel, env = null } = {}) {
  const router = express.Router();
  const auth = createAuthMiddleware({ User, env });
  const runtimeEnv = () => env || getEnv();

  router.post(
    "/register",
    validate({ body: registerSchema }),
    async (req, res, next) => {
      try {
        const existing = await User.findOne({ email: req.body.email });
        if (existing) {
          return sendError(res, {
            status: 409,
            message: "Este email já está cadastrado.",
            error: "ACCOUNT_EXISTS"
          });
        }

        const senha = await bcrypt.hash(req.body.senha, 12);
        const user = await User.create({
          nome: req.body.nome,
          email: req.body.email,
          senha,
          role: "client"
        });

        return sendSuccess(res, {
          status: 201,
          data: { user: sanitizeUser(user) },
          message: "Conta criada com sucesso."
        });
      } catch (error) {
        if (error?.code === 11000) {
          return sendError(res, {
            status: 409,
            message: "Este email já está cadastrado.",
            error: "ACCOUNT_EXISTS"
          });
        }
        return next(error);
      }
    }
  );

  router.post(
    "/login",
    validate({ body: credentialsSchema }),
    async (req, res, next) => {
      try {
        const user = await resolvePasswordUser(User, req.body.email);
        const matches = user
          ? await bcrypt.compare(req.body.senha, user.senha)
          : false;

        if (!user || !matches) {
          return sendError(res, {
            status: 401,
            message: "Email ou senha inválidos.",
            error: "INVALID_CREDENTIALS"
          });
        }

        const token = signUserToken(user, runtimeEnv());
        res.cookie(
          SESSION_COOKIE,
          token,
          getSessionCookieOptions(runtimeEnv())
        );

        return sendSuccess(res, {
          data: { user: sanitizeUser(user) },
          message: "Login realizado com sucesso."
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  router.get("/me", auth.requireAuth, (req, res) =>
    sendSuccess(res, {
      data: { user: sanitizeUser(req.user) },
      message: "Sessão autenticada."
    })
  );

  router.post("/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE, getClearCookieOptions(runtimeEnv()));
    return sendSuccess(res, {
      message: "Sessão encerrada."
    });
  });

  return router;
}

module.exports = createAuthRouter();
module.exports.createAuthRouter = createAuthRouter;
module.exports.sanitizeUser = sanitizeUser;
