const { loadEnv } = require("../../server/config/env");

const validProductionEnv = {
  NODE_ENV: "production",
  PORT: "3000",
  MONGO_URI: "mongodb+srv://user:password@example.mongodb.net/fotografia",
  JWT_SECRET: "a-secure-secret-with-at-least-thirty-two-characters",
  FRONTEND_URL: "https://example.vercel.app",
  STRIPE_SECRET_KEY: "stripe-secret-placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
  CLOUDINARY_CLOUD_NAME: "example",
  CLOUDINARY_API_KEY: "cloudinary-api-key",
  CLOUDINARY_API_SECRET: "cloudinary-secret",
  MEDIA_STORAGE: "cloudinary"
};

describe("loadEnv", () => {
  it("rejects missing production secrets", () => {
    expect(() => loadEnv({ NODE_ENV: "production" })).toThrow(/MONGO_URI/);
  });

  it("accepts a complete production configuration", () => {
    const env = loadEnv(validProductionEnv);

    expect(env.NODE_ENV).toBe("production");
    expect(env.PORT).toBe(3000);
    expect(env.FRONTEND_URLS).toEqual(["https://example.vercel.app"]);
  });

  it("parses a comma-separated frontend allowlist", () => {
    const env = loadEnv({
      ...validProductionEnv,
      FRONTEND_URL: "https://app.example.com, https://admin.example.com"
    });

    expect(env.FRONTEND_URLS).toEqual([
      "https://app.example.com",
      "https://admin.example.com"
    ]);
  });

  it("allows local media storage in development", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      MONGO_URI: "mongodb://127.0.0.1:27017/fotografia",
      JWT_SECRET: "a-secure-secret-with-at-least-thirty-two-characters",
      FRONTEND_URL: "http://localhost:5173",
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
