const { loadEnv } = require("../../server/config/env");

const validProductionEnv = {
  NODE_ENV: "production",
  PORT: "3000",
  MONGODB_URI: "mongodb+srv://user:password@example.mongodb.net/fotografia",
  JWT_SECRET: "a-secure-secret-with-at-least-thirty-two-characters",
  CLIENT_ORIGIN: "https://example.vercel.app",
  STRIPE_SECRET_KEY: "stripe-secret-placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
  CLOUDINARY_CLOUD_NAME: "example",
  CLOUDINARY_API_KEY: "cloudinary-api-key",
  CLOUDINARY_API_SECRET: "cloudinary-secret",
  MEDIA_STORAGE: "cloudinary"
};

describe("loadEnv", () => {
  it("rejects missing production secrets", () => {
    expect(() => loadEnv({ NODE_ENV: "production" })).toThrow(/MONGODB_URI/);
  });

  it("accepts a complete production configuration", () => {
    const env = loadEnv(validProductionEnv);

    expect(env.NODE_ENV).toBe("production");
    expect(env.PORT).toBe(3000);
    expect(env.MONGODB_URI).toContain("mongodb.net");
    expect(env.CLIENT_ORIGINS).toEqual(["https://example.vercel.app"]);
  });

  it("parses a comma-separated client origin allowlist", () => {
    const env = loadEnv({
      ...validProductionEnv,
      CLIENT_ORIGIN: "https://app.example.com, https://admin.example.com"
    });

    expect(env.CLIENT_ORIGINS).toEqual([
      "https://app.example.com",
      "https://admin.example.com"
    ]);
  });

  it("uses canonical environment names", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      MONGODB_URI: "mongodb://127.0.0.1:27017/fotografia",
      JWT_SECRET: "a-secure-secret-with-at-least-thirty-two-characters",
      CLIENT_ORIGIN: "http://localhost:3000",
      WHATSAPP_PHONE: "5517999999999"
    });

    expect(env.MONGODB_URI).toContain("fotografia");
    expect(env.CLIENT_ORIGINS).toEqual(["http://localhost:3000"]);
    expect(env.WHATSAPP_PHONE).toBe("5517999999999");
  });

  it("supports legacy environment aliases", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      MONGO_URI: "mongodb://127.0.0.1:27017/legacy",
      JWT_SECRET: "a-secure-secret-with-at-least-thirty-two-characters",
      FRONTEND_URL: "http://localhost:5173",
      WHATSAPP_NUMBER: "5517888888888"
    });

    expect(env.MONGODB_URI).toContain("legacy");
    expect(env.CLIENT_ORIGINS).toEqual(["http://localhost:5173"]);
    expect(env.WHATSAPP_PHONE).toBe("5517888888888");
  });

  it("provides local defaults only in development", () => {
    const env = loadEnv({ NODE_ENV: "development" });

    expect(env.MONGODB_URI).toBe(
      "mongodb://127.0.0.1:27017/fotografia"
    );
    expect(env.CLIENT_ORIGINS).toEqual(["http://localhost:3000"]);
    expect(env.JWT_SECRET).toHaveLength(40);
  });

  it("rejects production without JWT_SECRET", () => {
    expect(() =>
      loadEnv({
        ...validProductionEnv,
        JWT_SECRET: undefined
      })
    ).toThrow(/JWT_SECRET/);
  });

  it("allows local media storage in development", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      MONGODB_URI: "mongodb://127.0.0.1:27017/fotografia",
      JWT_SECRET: "a-secure-secret-with-at-least-thirty-two-characters",
      CLIENT_ORIGIN: "http://localhost:5173",
      MEDIA_STORAGE: "local"
    });

    expect(env.MEDIA_STORAGE).toBe("local");
  });

  it("rejects local media storage in production", () => {
    expect(() =>
      loadEnv({
        ...validProductionEnv,
        MEDIA_STORAGE: "local"
      })
    ).toThrow(/MEDIA_STORAGE/);
  });
});
