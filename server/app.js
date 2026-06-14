const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoose = require("mongoose");

const { sendSuccess } = require("./http/response");
const { errorHandler, notFoundHandler } = require("./middleware/errors");
const {
  authLimiter,
  galleryAccessLimiter,
  globalLimiter
} = require("./middleware/rate-limiters");

function loadDefaultRouters() {
  return {
    auth: require("../routes/auth"),
    galleries: require("../routes/galerias"),
    media: require("../routes/media"),
    uploads: require("../routes/upload"),
    photos: require("../routes/fotos"),
    payments: require("../routes/pagamentos"),
    stripeWebhook: require("../routes/webhook")
  };
}

function createCorsOptions(env) {
  const allowedOrigins = new Set(
    env.CLIENT_ORIGINS || env.FRONTEND_URLS || []
  );
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origem não autorizada.");
      error.status = 403;
      error.code = "CORS_ORIGIN_DENIED";
      return callback(error);
    }
  };
}

function createApp({
  env,
  routers,
  getDatabaseState = () => mongoose.connection.readyState === 1
    ? "connected"
    : "disconnected"
}) {
  const app = express();
  const configuredRouters = routers === undefined ? loadDefaultRouters() : routers;

  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(createCorsOptions(env)));

  if (configuredRouters.stripeWebhook) {
    app.use(
      "/api/webhooks/stripe",
      express.raw({ type: "application/json", limit: "1mb" }),
      configuredRouters.stripeWebhook
    );
  }

  const bodyLimit = `${Math.max(1, Number(env.MAX_UPLOAD_MB || 10))}mb`;
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
  app.use(cookieParser());

  if (env.NODE_ENV !== "test") {
    app.use("/api", globalLimiter);
  }

  app.get("/api/health", (_req, res) =>
    sendSuccess(res, {
      data: {
        status: "ok",
        database: getDatabaseState()
      },
      message: "API saudável."
    })
  );

  if (configuredRouters.auth) {
    app.use("/api/auth", authLimiter, configuredRouters.auth);
  }
  if (configuredRouters.galleries) {
    app.use(
      "/api/galleries/access",
      galleryAccessLimiter
    );
    app.use("/api/galleries", configuredRouters.galleries);
    app.use("/api/galerias", configuredRouters.galleries);
  }
  if (configuredRouters.photos) {
    app.use("/api/photos", configuredRouters.photos);
    app.use("/api/fotos", configuredRouters.photos);
  }
  if (configuredRouters.media) {
    app.use("/api/media", configuredRouters.media);
  }
  if (configuredRouters.uploads) {
    app.use("/api/uploads", configuredRouters.uploads);
    app.use("/api/upload", configuredRouters.uploads);
  }
  if (configuredRouters.payments) {
    app.use("/api/payments", configuredRouters.payments);
    app.use("/api/pagamento", configuredRouters.payments);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
  createCorsOptions
};
