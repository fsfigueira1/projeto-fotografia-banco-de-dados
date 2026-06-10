const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().max(65535).default(3000),
    MONGO_URI: z.string().trim().min(1, "MONGO_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),
    JWT_EXPIRES_IN: z.string().trim().min(1).default("7d"),
    GALLERY_SESSION_EXPIRES_IN: z.string().trim().min(1).default("8h"),
    FRONTEND_URL: z.string().trim().min(1, "FRONTEND_URL is required"),
    STRIPE_SECRET_KEY: z.string().trim().optional().default(""),
    STRIPE_WEBHOOK_SECRET: z.string().trim().optional().default(""),
    CLOUDINARY_CLOUD_NAME: z.string().trim().optional().default(""),
    CLOUDINARY_API_KEY: z.string().trim().optional().default(""),
    CLOUDINARY_API_SECRET: z.string().trim().optional().default(""),
    MEDIA_STORAGE: z.enum(["local", "cloudinary"]).default("local"),
    COOKIE_DOMAIN: z.string().trim().optional().default(""),
    MAX_UPLOAD_MB: z.coerce.number().positive().max(100).default(10),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
    WHATSAPP_NUMBER: z.string().trim().optional().default("")
  })
  .superRefine((env, context) => {
    const frontendUrls = env.FRONTEND_URL.split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!frontendUrls.length) {
      context.addIssue({
        code: "custom",
        path: ["FRONTEND_URL"],
        message: "FRONTEND_URL must contain at least one origin"
      });
    }

    for (const value of frontendUrls) {
      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("unsupported protocol");
        }
      } catch {
        context.addIssue({
          code: "custom",
          path: ["FRONTEND_URL"],
          message: `FRONTEND_URL contains an invalid origin: ${value}`
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

function loadEnv(source) {
  const result = environmentSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${formatEnvironmentError(result.error)}`);
  }

  const frontendUrls = result.data.FRONTEND_URL.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return Object.freeze({
    ...result.data,
    FRONTEND_URLS: frontendUrls
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
  getEnv,
  loadEnv,
  resetEnvCache
};
