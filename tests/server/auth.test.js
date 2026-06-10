const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");

const TEST_ENV = {
  NODE_ENV: "test",
  JWT_SECRET: "a-secure-secret-with-at-least-thirty-two-characters",
  JWT_EXPIRES_IN: "7d",
  COOKIE_DOMAIN: ""
};

function createUserModel() {
  const users = new Map();
  let sequence = 0;

  return {
    users,
    async create(input) {
      const existing = [...users.values()].find((user) => user.email === input.email);
      if (existing) {
        const error = new Error("duplicate");
        error.code = 11000;
        throw error;
      }

      const user = {
        _id: String(++sequence),
        ...input
      };
      users.set(user._id, user);
      return user;
    },
    async findOne(filter) {
      return [...users.values()].find((user) => user.email === filter.email) || null;
    },
    async findById(id) {
      return users.get(String(id)) || null;
    }
  };
}

function createTestApp(User) {
  const { createAuthRouter } = require("../../routes/auth");
  const { createAuthMiddleware } = require("../../server/middleware/auth");
  const { errorHandler } = require("../../server/middleware/errors");
  const app = express();
  const auth = createAuthMiddleware({ User, env: TEST_ENV });

  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", createAuthRouter({ User, env: TEST_ENV }));
  app.get("/api/admin-check", auth.requireAuth, auth.requireAdmin, (_req, res) => {
    res.json({ success: true });
  });
  app.use(errorHandler);
  return app;
}

describe("authentication API", () => {
  it("registers a client and hashes the password", async () => {
    const User = createUserModel();
    const app = createTestApp(User);

    const response = await request(app).post("/api/auth/register").send({
      nome: "Cliente Teste",
      email: " CLIENTE@EXAMPLE.COM ",
      senha: "secure-password"
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe("client");
    expect(response.body.data.user).not.toHaveProperty("senha");
    const stored = [...User.users.values()][0];
    expect(stored.email).toBe("cliente@example.com");
    expect(stored.senha).not.toBe("secure-password");
  });

  it("rejects duplicate registration", async () => {
    const User = createUserModel();
    const app = createTestApp(User);
    const payload = {
      nome: "Cliente Teste",
      email: "cliente@example.com",
      senha: "secure-password"
    };

    await request(app).post("/api/auth/register").send(payload);
    const response = await request(app).post("/api/auth/register").send(payload);

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("ACCOUNT_EXISTS");
  });

  it("logs in with an HttpOnly cookie and does not return a token", async () => {
    const User = createUserModel();
    const app = createTestApp(User);
    await request(app).post("/api/auth/register").send({
      nome: "Cliente Teste",
      email: "cliente@example.com",
      senha: "secure-password"
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "cliente@example.com",
      senha: "secure-password"
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user).not.toHaveProperty("token");
    expect(response.headers["set-cookie"][0]).toContain("ff_session=");
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
  });

  it("rejects invalid credentials", async () => {
    const User = createUserModel();
    const app = createTestApp(User);

    const response = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      senha: "wrong-password"
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("INVALID_CREDENTIALS");
  });

  it("returns the current user and clears the session on logout", async () => {
    const User = createUserModel();
    const app = createTestApp(User);
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      nome: "Cliente Teste",
      email: "cliente@example.com",
      senha: "secure-password"
    });
    await agent.post("/api/auth/login").send({
      email: "cliente@example.com",
      senha: "secure-password"
    });

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe("cliente@example.com");

    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(200);
    expect(logout.headers["set-cookie"][0]).toContain("ff_session=;");

    const afterLogout = await agent.get("/api/auth/me");
    expect(afterLogout.status).toBe(401);
  });

  it("blocks client users from admin routes", async () => {
    const User = createUserModel();
    const app = createTestApp(User);
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      nome: "Cliente Teste",
      email: "cliente@example.com",
      senha: "secure-password"
    });
    await agent.post("/api/auth/login").send({
      email: "cliente@example.com",
      senha: "secure-password"
    });

    const response = await agent.get("/api/admin-check");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("ADMIN_REQUIRED");
  });
});
