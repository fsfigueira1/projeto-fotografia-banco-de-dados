# Phase 1 Production Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish validated environment configuration, secure database startup, consistent API responses, cookie authentication, admin bootstrap, and baseline automated tests.

**Architecture:** Introduce a small Express application factory so startup and HTTP behavior can be tested independently. Centralize configuration, responses, errors, authentication, and validation under `server/`, then migrate auth routes and server composition onto those boundaries without changing payment or gallery behavior in this phase.

**Tech Stack:** Node.js, Express 5, MongoDB/Mongoose, Zod, bcrypt, JWT, Helmet, express-rate-limit, cookie-parser, CORS, Vitest, Supertest

---

## File Structure

- Create `server/config/env.js`: parse and validate runtime variables.
- Create `server/config/database.js`: connect and disconnect MongoDB.
- Create `server/http/response.js`: success and failure envelopes.
- Create `server/middleware/auth.js`: cookie token authentication and role checks.
- Create `server/middleware/errors.js`: not-found and centralized error handling.
- Create `server/middleware/validate.js`: Zod request validation.
- Create `server/middleware/rate-limiters.js`: global and authentication limits.
- Create `server/app.js`: Express application factory and middleware order.
- Modify `server/server.js`: validated startup and graceful shutdown only.
- Modify `server/security.js`: token helpers without secret fallbacks.
- Modify `routes/auth.js`: secure cookie-based auth endpoints.
- Modify `models/User.js`: required fields, hidden password hash, indexes.
- Create `scripts/create-admin.js`: interactive administrator bootstrap.
- Create `tests/server/env.test.js`: configuration validation tests.
- Create `tests/server/auth.test.js`: authentication and authorization tests.
- Create `vitest.config.js`: Node test environment and test paths.
- Create `.env.example`: documented safe configuration placeholders.
- Modify `.gitignore`: ignore secrets, logs, generated bundles, uploads, and temporary companion state.
- Modify `package.json`: development, backend, typecheck, test, and admin scripts.

### Task 1: Install Foundation Dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install runtime security and validation packages**

Run:

```powershell
npm.cmd install cookie-parser dotenv express-rate-limit helmet zod
```

Expected: dependencies are recorded without audit-blocking install errors.

- [ ] **Step 2: Install backend test packages**

Run:

```powershell
npm.cmd install --save-dev supertest vitest
```

Expected: dev dependencies are recorded and `npm.cmd ls --depth=0` exits successfully.

- [ ] **Step 3: Add explicit scripts**

Set:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "node --watch server/server.js",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "start": "node server/server.js",
    "create-admin": "node scripts/create-admin.js",
    "seed:eventos": "node scripts/seed-fauzi-eventos.js"
  }
}
```

- [ ] **Step 4: Verify package metadata**

Run:

```powershell
npm.cmd ls --depth=0
```

Expected: exit code 0.

### Task 2: Test And Implement Environment Validation

**Files:**
- Create: `tests/server/env.test.js`
- Create: `server/config/env.js`
- Create: `.env.example`

- [ ] **Step 1: Write failing environment tests**

Cover:

```js
it("rejects missing production secrets", () => {
  expect(() => loadEnv({ NODE_ENV: "production" })).toThrow(/MONGO_URI/);
});

it("accepts a complete production configuration", () => {
  const env = loadEnv(validProductionEnv);
  expect(env.NODE_ENV).toBe("production");
  expect(env.FRONTEND_URLS).toEqual(["https://example.vercel.app"]);
});

it("allows local media storage only outside production", () => {
  expect(() => loadEnv({ ...validProductionEnv, MEDIA_STORAGE: "local" }))
    .toThrow(/MEDIA_STORAGE/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npx.cmd vitest run tests/server/env.test.js
```

Expected: failure because `server/config/env.js` does not exist.

- [ ] **Step 3: Implement validated configuration**

Use a Zod schema that:

- defaults `NODE_ENV` to `development`,
- parses `PORT`,
- requires `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL`,
- requires Stripe and Cloudinary values in production,
- parses comma-separated frontend origins,
- rejects `MEDIA_STORAGE=local` in production,
- exports `loadEnv(source)` and lazy `getEnv()`.

- [ ] **Step 4: Create safe environment documentation**

Include:

```dotenv
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/fotografia
JWT_SECRET=replace-with-at-least-32-random-characters
JWT_EXPIRES_IN=7d
GALLERY_SESSION_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MEDIA_STORAGE=local
MAX_UPLOAD_MB=10
WHATSAPP_NUMBER=
VITE_API_URL=http://localhost:3000/api
```

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```powershell
npx.cmd vitest run tests/server/env.test.js
```

Expected: all environment tests pass.

### Task 3: Secure Database Startup

**Files:**
- Create: `server/config/database.js`
- Modify: `server/db.js`
- Modify: `server/server.js`

- [ ] **Step 1: Replace import-time database connection**

Implement:

```js
async function connectDatabase(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });
  return mongoose.connection;
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}
```

- [ ] **Step 2: Keep model imports compatible**

Change `server/db.js` to export the unconnected `mongoose` instance only. Models continue importing it without causing network activity.

- [ ] **Step 3: Make startup await configuration and MongoDB**

`server/server.js` must:

1. load validated env,
2. connect MongoDB,
3. create the Express app,
4. listen on the configured port,
5. close HTTP and MongoDB connections on `SIGINT`/`SIGTERM`,
6. exit nonzero on startup failure.

- [ ] **Step 4: Verify missing configuration fails clearly**

Run:

```powershell
$env:NODE_ENV='production'; Remove-Item Env:MONGO_URI -ErrorAction SilentlyContinue; node server/server.js
```

Expected: nonzero exit and a message listing `MONGO_URI` without printing secrets.

### Task 4: Standardize HTTP Responses And Errors

**Files:**
- Create: `server/http/response.js`
- Create: `server/middleware/errors.js`
- Create: `server/middleware/validate.js`

- [ ] **Step 1: Add response helpers**

Implement:

```js
function sendSuccess(res, { status = 200, data = null, message = "OK" } = {}) {
  return res.status(status).json({ success: true, data, message, error: null });
}

function sendError(res, { status = 500, message = "Erro interno.", error = "INTERNAL_ERROR" } = {}) {
  return res.status(status).json({ success: false, data: null, message, error });
}
```

- [ ] **Step 2: Add request validation middleware**

`validate({ body, params, query })` parses the requested sections, replaces them with normalized values, and forwards Zod errors to centralized error handling.

- [ ] **Step 3: Add centralized error handling**

Map:

- Zod errors to `400 VALIDATION_ERROR`,
- duplicate keys to `409 RESOURCE_CONFLICT`,
- invalid Mongo IDs to `400 INVALID_IDENTIFIER`,
- unknown errors to `500 INTERNAL_ERROR`.

Production responses must omit stack traces.

### Task 5: Test And Implement Cookie Authentication

**Files:**
- Create: `tests/server/auth.test.js`
- Modify: `server/security.js`
- Create: `server/middleware/auth.js`
- Modify: `models/User.js`
- Modify: `routes/auth.js`

- [ ] **Step 1: Write failing auth tests**

Cover:

- registration hashes passwords and always creates `client`,
- duplicate registration returns `409`,
- login returns an auth cookie without returning a token in JSON,
- wrong credentials return `401`,
- `/me` requires the cookie,
- logout clears the cookie,
- admin middleware rejects clients.

- [ ] **Step 2: Run auth tests and verify RED**

Run:

```powershell
npx.cmd vitest run tests/server/auth.test.js
```

Expected: failures because the application factory and cookie endpoints are not implemented.

- [ ] **Step 3: Harden the User schema**

Require:

```js
nome: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 }
email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true }
senha: { type: String, required: true, select: false }
role: { type: String, required: true, enum: ["client", "admin"], default: "client", index: true }
```

Keep timestamps enabled.

- [ ] **Step 4: Remove insecure token behavior**

`server/security.js` receives the validated secret from configuration. It must not:

- contain a fallback secret,
- accept tokens from query strings,
- authorize based on email literals.

- [ ] **Step 5: Implement cookie helpers and middleware**

Use one cookie name, `ff_session`. Authentication reads only the cookie, loads the current user from MongoDB, and attaches a sanitized user to `req.user`.

- [ ] **Step 6: Rewrite auth routes**

Endpoints:

```text
POST /register
POST /login
GET  /me
POST /logout
```

All return the standard envelope. Registration and login use Zod validation, generic credential errors, bcrypt cost 12, and no hardcoded bypass.

- [ ] **Step 7: Run auth tests and verify GREEN**

Run:

```powershell
npx.cmd vitest run tests/server/auth.test.js
```

Expected: all auth tests pass.

### Task 6: Compose The Secure Express Application

**Files:**
- Create: `server/app.js`
- Create: `server/middleware/rate-limiters.js`
- Modify: `server/server.js`

- [ ] **Step 1: Build middleware order**

Order:

1. trust proxy in production,
2. Helmet,
3. CORS allowlist with credentials,
4. Stripe webhook raw route placeholder before JSON parsing,
5. JSON and URL-encoded parsers with size limits,
6. cookie parser,
7. global rate limiter,
8. `/api/health`,
9. API routes,
10. not-found middleware,
11. error middleware.

- [ ] **Step 2: Add authentication rate limiting**

Use stricter limits for login, registration, and gallery-code endpoints. Return the standard `RATE_LIMITED` envelope.

- [ ] **Step 3: Mount version-neutral API paths**

Mount current routers under:

```text
/api/auth
/api/galleries
/api/photos
/api/media
/api/uploads
/api/payments
/api/webhooks/stripe
```

Temporary legacy aliases may remain only until frontend migration in Phase 4.

- [ ] **Step 4: Add health response**

Return:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected"
  },
  "message": "API saudável.",
  "error": null
}
```

### Task 7: Create Secure Administrator Bootstrap

**Files:**
- Create: `scripts/create-admin.js`

- [ ] **Step 1: Implement interactive prompts**

Use Node `readline/promises` to ask for name, email, password, and confirmation. Do not echo or store a default credential.

- [ ] **Step 2: Validate and persist**

Require:

- valid email,
- password of at least 12 characters,
- matching confirmation.

Hash with bcrypt cost 12 and upsert the user with `role: "admin"`.

- [ ] **Step 3: Verify safely**

Run:

```powershell
npm.cmd run create-admin
```

Expected: with configured MongoDB, the command creates or promotes one administrator and prints only the normalized email.

### Task 8: Ignore Secrets And Generated State

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add repository exclusions**

Add:

```gitignore
node_modules/
.env
.env.*
!.env.example
*.log
uploads/
.superpowers/
coverage/
public/assets/
```

- [ ] **Step 2: Stop tracking generated assets and logs**

Remove tracked generated bundles and log files from the Git index without deleting unrelated source files. Preserve the user's current `public/index.html` modification.

- [ ] **Step 3: Verify secret scan**

Run:

```powershell
rg -n -g '!node_modules/**' -g '!.git/**' -e 'sk_test_' -e 'sk_live_' -e 'dev-fauzi-secret' -e '123456' -e 'TEST_LOGIN' .
```

Expected: no production-code matches.

### Task 9: Final Phase Verification

**Files:**
- Create: `vitest.config.js`
- Modify if needed: files from Tasks 1-8

- [ ] **Step 1: Run focused backend tests**

Run:

```powershell
npm.cmd test -- tests/server/env.test.js tests/server/auth.test.js
```

Expected: all tests pass.

- [ ] **Step 2: Run TypeScript checking**

Run:

```powershell
npm.cmd run typecheck
```

Expected: exit code 0.

- [ ] **Step 3: Run production frontend build**

Run:

```powershell
npm.cmd run build
```

Expected: Vite build exits 0.

- [ ] **Step 4: Audit the final diff**

Confirm:

- no fixed admin credential,
- no JWT fallback secret,
- no Stripe key,
- `.env.example` contains placeholders only,
- `public/index.html` user changes remain intact,
- authentication tests prove cookie behavior.
