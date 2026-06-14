const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

const DEVELOPMENT_MONGODB_URI =
  "mongodb://127.0.0.1:27017/fotografia";
const DEVELOPMENT_CLIENT_ORIGIN = "http://localhost:3000";
const DEVELOPMENT_JWT_SECRET =
  "development-only-jwt-secret-000000000000";

const inputSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  MONGODB_URI: z.string().trim().optional(),
  MONGO_URI: z.string().trim().optional(),
  JWT_SECRET: z.string().trim().optional(),
  JWT_EXPIRES_IN: z.string().trim().min(1).default("7d"),
  GALLERY_SESSION_EXPIRES_IN: z.string().trim().min(1).default("8h"),
  CLIENT_ORIGIN: z.string().trim().optional(),
  FRONTEND_URL: z.string().trim().optional(),
  STRIPE_SECRET_KEY: z.string().trim().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().trim().optional().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().trim().optional().default(""),
  CLOUDINARY_API_KEY: z.string().trim().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().trim().optional().default(""),
  MEDIA_STORAGE: z.enum(["local", "cloudinary"]).default("local"),
  COOKIE_DOMAIN: z.string().trim().optional().default(""),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(100).default(10),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  WHATSAPP_PHONE: z.string().trim().optional(),
  WHATSAPP_NUMBER: z.string().trim().optional()
});

const normalizedSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT: z.number().int().positive().max(65535),
    MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),
    JWT_EXPIRES_IN: z.string().trim().min(1),
    GALLERY_SESSION_EXPIRES_IN: z.string().trim().min(1),
    CLIENT_ORIGIN: z.string().trim().min(1, "CLIENT_ORIGIN is required"),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),
    MEDIA_STORAGE: z.enum(["local", "cloudinary"]),
    COOKIE_DOMAIN: z.string(),
    MAX_UPLOAD_MB: z.number().positive().max(100),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]),
    WHATSAPP_PHONE: z.string()
  })
  .superRefine((env, context) => {
    const clientOrigins = env.CLIENT_ORIGIN.split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!clientOrigins.length) {
      context.addIssue({
        code: "custom",
        path: ["CLIENT_ORIGIN"],
        message: "CLIENT_ORIGIN must contain at least one origin"
      });
    }

    for (const value of clientOrigins) {
      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("unsupported protocol");
        }
      } catch {
        context.addIssue({
          code: "custom",
          path: ["CLIENT_ORIGIN"],
          message: `CLIENT_ORIGIN contains an invalid origin: ${value}`
        });
      }
    }

    if (env.NODE_ENV !== "production") return;

    if (env.MEDIA_STORAGE !== "cloudinary") {
      context.addIssue({
        code: "custom",
        path: ["MEDIA_STORAGE"],
        message: "MEDIA_STORAGE must be cloudinary in production"
      });
    }

    for (const key of [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET"
    ]) {
      if (!env[key]) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required in production`
        });
      }
    }
  });

let cachedEnv = null;

function formatEnvironmentError(error) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("\n");
}

function parseOrThrow(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${formatEnvironmentError(result.error)}`
    );
  }
  return result.data;
}

function loadEnv(source) {
  const input = parseOrThrow(inputSchema, source);
  const allowLocalFallback = input.NODE_ENV !== "production";

  const normalized = parseOrThrow(normalizedSchema, {
    ...input,
    MONGODB_URI:
      input.MONGODB_URI ||
      input.MONGO_URI ||
      (allowLocalFallback ? DEVELOPMENT_MONGODB_URI : ""),
    JWT_SECRET:
      input.JWT_SECRET ||
      (allowLocalFallback ? DEVELOPMENT_JWT_SECRET : ""),
    CLIENT_ORIGIN:
      input.CLIENT_ORIGIN ||
      input.FRONTEND_URL ||
      (allowLocalFallback ? DEVELOPMENT_CLIENT_ORIGIN : ""),
    WHATSAPP_PHONE:
      input.WHATSAPP_PHONE ||
      input.WHATSAPP_NUMBER ||
      ""
  });

  const clientOrigins = normalized.CLIENT_ORIGIN.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return Object.freeze({
    ...normalized,
    CLIENT_ORIGINS: clientOrigins,
    MONGO_URI: normalized.MONGODB_URI,
    FRONTEND_URL: normalized.CLIENT_ORIGIN,
    FRONTEND_URLS: clientOrigins,
    WHATSAPP_NUMBER: normalized.WHATSAPP_PHONE
  });
}

function getEnv() {
  if (cachedEnv) return cachedEnv;

  dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
    quiet: true
  });
  cachedEnv = loadEnv(process.env);
  return cachedEnv;
}

function resetEnvCache() {
  cachedEnv = null;
}

module.exports = {
  DEVELOPMENT_CLIENT_ORIGIN,
  DEVELOPMENT_JWT_SECRET,
  DEVELOPMENT_MONGODB_URI,
  getEnv,
  loadEnv,
  resetEnvCache
};
