const express = require("express");
const request = require("supertest");

const TEST_ENV = {
  NODE_ENV: "test",
  FRONTEND_URLS: ["http://localhost:5173"],
  MAX_UPLOAD_MB: 10
};

describe("Express application", () => {
  it("exposes a standardized health endpoint", async () => {
    const { createApp } = require("../../server/app");
    const app = createApp({
      env: TEST_ENV,
      routers: {},
      getDatabaseState: () => "connected"
    });

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: "ok",
        database: "connected"
      },
      message: "API saudável.",
      error: null
    });
  });

  it("adds security headers and allows configured origins", async () => {
    const { createApp } = require("../../server/app");
    const app = createApp({ env: TEST_ENV, routers: {} });

    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173"
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("rejects unconfigured browser origins", async () => {
    const { createApp } = require("../../server/app");
    const app = createApp({ env: TEST_ENV, routers: {} });

    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://malicious.example");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("CORS_ORIGIN_DENIED");
  });

  it("keeps temporary Portuguese API aliases during frontend migration", async () => {
    const { createApp } = require("../../server/app");
    const router = express.Router();
    router.get("/me", (_req, res) => res.json({ ok: true }));
    const app = createApp({
      env: TEST_ENV,
      routers: { galleries: router }
    });

    const canonical = await request(app).get("/api/galleries/me");
    const legacy = await request(app).get("/api/galerias/me");

    expect(canonical.status).toBe(200);
    expect(legacy.status).toBe(200);
  });
});
