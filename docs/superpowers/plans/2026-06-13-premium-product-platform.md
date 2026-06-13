# Premium Product Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a premium, production-ready photography platform in five gated stages while preserving gallery access, administration, uploads, payments, and protected downloads.

**Architecture:** Keep the existing React/Vite frontend and the centralized Express configuration and service layers. Split only focused presentation and pure state helpers out of the oversized frontend files, preserve all existing API aliases, and implement every behavior change with a failing test before production code.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS 4, Framer Motion, GSAP, Lenis, Lucide React, Node.js, Express 5, MongoDB/Mongoose, Stripe, Cloudinary, Vitest, Supertest.

---

## Global Execution Rules

- Execute stages strictly in order.
- Stop a stage immediately when a focused test, full related test suite,
  typecheck, or build fails.
- Do not install dependencies.
- Do not remove or rename existing API route families.
- Use `npm.cmd` instead of `npm` in PowerShell when execution policy blocks
  `npm.ps1`.
- Keep user changes and unrelated tracked files intact.
- At the end of each stage, report changed files, behavior delivered, test/build
  results, and environment values the user must provide.

## File Responsibility Map

- `src/components/PremiumHome.tsx`: public landing composition and action wiring.
- `src/components/PremiumCamera.tsx`: local-image camera with CSS fallback and
  pointer tilt.
- `src/components/Reveal.tsx`: reduced-motion-aware section reveal wrapper.
- `src/styles.css`: shared premium tokens, camera fallback, grid, and responsive
  behavior not expressible cleanly through utilities.
- `src/lib/api.ts`: API base URL selection and normalization.
- `src/lib/gallery.ts`: pure photo ownership, selection, and total helpers.
- `src/App.tsx`: application orchestration, modals, checkout, gallery, and admin
  action wiring.
- `server/config/env.js`: canonical environment schema, aliases, and safe
  development defaults.
- `server/config/database.js`: database connection and actionable errors.
- `server/services/stripe.js`: explicit Stripe configuration failure.
- `server/services/purchases.js`: trusted checkout URLs and purchase creation.
- `.env.example`: complete local and production configuration contract.
- `README.md`: product and operations documentation.
- `.gitignore`: generated and secret file policy.

# Stage 1: Landing Page Premium Direction A

## Objective

Replace the current editorial/horizontal landing with the approved product
layout: clear commercial copy on the left, resilient camera visual on the
right, populated value cards, four-step experience, services,
differentiators, and final CTA.

## Files

- Create: `src/components/PremiumCamera.tsx`
- Create: `src/components/Reveal.tsx`
- Modify: `src/components/PremiumHome.tsx`
- Modify: `src/styles.css`
- Modify: `tests/client/premium-home.test.js`
- Create: `tests/client/premium-camera.test.js`

## Exact Technical Changes

- Remove the Canvas camera implementation and the landing-only GSAP horizontal
  scroll sequence.
- Keep Framer Motion for entry and hover animation.
- Implement local camera source fallback in this order:
  `/images/camera-hero.png`, `/img/camera-hero.png`, `/camera-hero.png`, then
  CSS mock.
- Keep the CSS mock mounted behind the image so an image failure never leaves
  an empty hero.
- Add `id="experiencia"` and `id="servicos"` section anchors.
- Make `Conhecer experiência` call
  `document.getElementById("experiencia")?.scrollIntoView({ behavior:
  "smooth", block: "start" })`.
- Keep `Acessar Galeria` wired directly to `openGalleryAccess`.
- Keep navigation `Login` wired to `openAuthModal("login")`.
- Render the exact approved copy and all required cards.
- Use the existing `services` prop and
  `openServicePurchase(service)` without changing the service type.
- Use Lucide icons already installed for the differentiators.
- Add `overflow-x: clip`, reduced-motion overrides, focus-visible states, and
  360px responsive rules.

## Risks of Breakage

- Removing GSAP/Lenis landing setup can leave stale imports or effect cleanup.
- A malformed local image fallback loop can repeatedly request missing images.
- Navigation callbacks can regress if text links are converted to anchors
  without preserving handlers.
- Hero transforms can cause horizontal overflow at 360px.

## Task 1.1: Lock Landing Behavior With Failing Tests

- [ ] **Step 1: Replace the current assertions in
  `tests/client/premium-home.test.js` with exact requirements**

```js
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/PremiumHome.tsx"),
  "utf8"
);

describe("PremiumHome", () => {
  it("renders the approved product copy and section anchors", () => {
    expect(source).toContain("GALERIA PRIVADA PREMIUM");
    expect(source).toContain("Fotografia de eventos com compra segura");
    expect(source).toContain("Galerias privadas por senha, seleção de favoritas");
    expect(source).toContain('id="experiencia"');
    expect(source).toContain('id="servicos"');
  });

  it("preserves gallery, experience, login, service, and admin actions", () => {
    expect(source).toContain("onClick={openGalleryAccess}");
    expect(source).toContain('scrollIntoView({ behavior: "smooth"');
    expect(source).toContain('openAuthModal("login")');
    expect(source).toContain("openServicePurchase(service)");
    expect(source).toContain("onClick={openAdminPage}");
  });

  it("renders populated value, process, and differentiator content", () => {
    expect(source).toContain("Acesso por senha");
    expect(source).toContain("Compra individual");
    expect(source).toContain("Entrega segura");
    expect(source).toContain("Contratação do serviço");
    expect(source).toContain("Experiência responsiva");
  });

  it("does not use canvas or WebGL for the camera", () => {
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("three");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm.cmd test -- --run tests/client/premium-home.test.js
```

Expected: FAIL because the current hero copy, experience scroll behavior, and
non-Canvas camera do not meet the assertions.

## Task 1.2: Build the Resilient Camera

- [ ] **Step 1: Create `tests/client/premium-camera.test.js`**

```js
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/PremiumCamera.tsx"),
  "utf8"
);

describe("PremiumCamera", () => {
  it("tries local images in order and retains a CSS fallback", () => {
    expect(source).toContain('"/images/camera-hero.png"');
    expect(source).toContain('"/img/camera-hero.png"');
    expect(source).toContain('"/camera-hero.png"');
    expect(source).toContain('data-camera-fallback');
  });

  it("supports reduced motion and pointer tilt without canvas", () => {
    expect(source).toContain("useReducedMotion");
    expect(source).toContain("onPointerMove");
    expect(source).not.toContain("<canvas");
  });
});
```

- [ ] **Step 2: Run the camera test and verify RED**

Run:

```powershell
npm.cmd test -- --run tests/client/premium-camera.test.js
```

Expected: FAIL because `PremiumCamera.tsx` does not exist.

- [ ] **Step 3: Create `src/components/PremiumCamera.tsx`**

Implementation contract:

```tsx
const CAMERA_SOURCES = [
  "/images/camera-hero.png",
  "/img/camera-hero.png",
  "/camera-hero.png"
] as const;
```

The component must:

- Track the current source index with `useState`.
- Set the image to `null` after the third `onError`.
- Always render `<div data-camera-fallback>` beneath the image.
- Use `useReducedMotion()` to disable float and tilt.
- Store pointer tilt in React state or motion values capped at 5 degrees.
- Reset tilt on pointer leave.
- Use no global listeners and no scroll interception.

- [ ] **Step 4: Run the camera test and verify GREEN**

Run:

```powershell
npm.cmd test -- --run tests/client/premium-camera.test.js
```

Expected: 1 file and 2 tests passing.

## Task 1.3: Implement the Direction A Landing

- [ ] **Step 1: Rewrite `src/components/PremiumHome.tsx` around focused data
  arrays**

Use these exact arrays:

```tsx
const valueCards = [
  {
    title: "Acesso por senha",
    description:
      "Cada cliente recebe um código exclusivo para acessar sua galeria."
  },
  {
    title: "Compra individual",
    description:
      "Escolha suas fotos favoritas e compre apenas o que desejar."
  },
  {
    title: "Entrega segura",
    description:
      "Download liberado após confirmação do pagamento."
  }
];

const experienceSteps = [
  "Contratação do serviço",
  "Criação da galeria privada",
  "Acesso por senha",
  "Seleção, pagamento e download"
];
```

The final component order is:

1. Product navigation.
2. Two-column hero.
3. Three value cards inside the hero fold.
4. `#experiencia` four-step section.
5. `#servicos` service card grid.
6. Differentiator grid.
7. Final CTA.

- [ ] **Step 2: Create `src/components/Reveal.tsx`**

The wrapper accepts `children`, optional `delay`, and optional `className`. It
uses `useReducedMotion()` and renders content visible immediately when motion
is reduced. Normal motion is `opacity: 0, y: 24` to `opacity: 1, y: 0` with
`viewport={{ once: true, amount: 0.15 }}`.

- [ ] **Step 3: Update `src/styles.css`**

Add named classes for:

- `.premium-grid`
- `.camera-stage`
- `.camera-fallback`
- `.camera-body`
- `.camera-lens`
- `.camera-glow`
- `.premium-action-primary`
- `.premium-action-secondary`

The mobile breakpoint at `max-width: 480px` must:

- Disable decorative overflow.
- Reduce camera width below `300px`.
- Stack both hero actions at full width.
- Keep headline at or below `3rem`.

- [ ] **Step 4: Run focused tests**

```powershell
npm.cmd test -- --run tests/client/premium-home.test.js tests/client/premium-camera.test.js
```

Expected: 2 files and all tests passing.

- [ ] **Step 5: Run typecheck and build**

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit Stage 1**

```powershell
git add src/components/PremiumHome.tsx src/components/PremiumCamera.tsx src/components/Reveal.tsx src/styles.css tests/client/premium-home.test.js tests/client/premium-camera.test.js public/app.html
git commit -m "feat: implement premium product landing"
```

## Manual Validation

1. Run `npm.cmd run dev -- --host 127.0.0.1`.
2. Open the printed URL at widths 360px, 768px, and 1440px.
3. Confirm the camera remains visible after forcing all three image URLs to
   fail.
4. Click `Acessar Galeria`; the gallery code modal must open.
5. Click `Conhecer experiência`; the page must scroll to `#experiencia`.
6. Click `Galeria`, `Serviços`, and `Login` in the navigation.
7. Open each service action and confirm the existing purchase modal appears.
8. Confirm keyboard focus is visible and no horizontal scrollbar appears.

## Stage 1 Completion Criteria

- All exact copy and sections are present.
- Both required hero buttons work.
- Camera uses no Canvas and survives missing assets.
- Focused tests, typecheck, and build pass.
- No gallery, admin, authentication, or checkout code is changed in this stage.

# Stage 2: Security and Environment Variables

## Objective

Adopt the requested canonical environment names while preserving existing
deployments, provide safe development defaults, reject unsafe production
configuration, and keep checkout URLs and browser API URLs environment-aware.

## Files

- Modify: `.env.example`
- Modify: `server/config/env.js`
- Modify: `server/config/database.js`
- Modify: `server/server.js`
- Modify: `server/services/stripe.js`
- Modify: `server/services/purchases.js`
- Modify: `src/lib/api.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/App.tsx`
- Modify: `tests/server/env.test.js`
- Modify: `tests/server/database.test.js`
- Modify: `tests/server/purchases.test.js`
- Modify: `tests/server/payments.test.js`
- Create: `tests/client/api.test.js`

## Exact Technical Changes

- Canonical names: `MONGODB_URI`, `CLIENT_ORIGIN`, `WHATSAPP_PHONE`.
- Compatibility aliases: `MONGO_URI`, `FRONTEND_URL`, `WHATSAPP_NUMBER`.
- Normalize the parsed result back to stable runtime fields:
  `MONGODB_URI`, `CLIENT_ORIGINS`, and `WHATSAPP_PHONE`.
- Update consumers to use normalized fields, not legacy fields.
- Development defaults apply only when `NODE_ENV === "development"`.
- Test environments must supply explicit values for deterministic tests.
- Production must reject missing MongoDB URI, JWT secret, client origin, Stripe
  secrets, and required Cloudinary configuration.
- API URL resolution:
  explicit `VITE_API_URL`; otherwise localhost in development; otherwise
  relative `/api`.
- Add `VITE_WHATSAPP_PHONE` as the browser-safe public mirror of
  `WHATSAPP_PHONE`; no private key is exposed.
- Replace both hardcoded WhatsApp numbers in `App.tsx`.

## Risks of Breakage

- Renaming runtime fields without aliases can break the server at startup.
- Default JWT secrets in production would create a critical vulnerability.
- Missing `/api` suffix can make every frontend request return HTML or 404.
- Stripe service construction during module import can turn a clear checkout
  error into server startup failure.
- Changing CORS origin fields can block development login and gallery requests.

## Task 2.1: Specify Environment Alias and Production Rules

- [ ] **Step 1: Extend `tests/server/env.test.js` with failing tests**

Add tests asserting:

```js
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

it("supports legacy aliases", () => {
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
  const env = loadEnv({
    NODE_ENV: "development",
    JWT_SECRET: "a-secure-secret-with-at-least-thirty-two-characters"
  });

  expect(env.MONGODB_URI).toBe(
    "mongodb://127.0.0.1:27017/fotografia"
  );
  expect(env.CLIENT_ORIGINS).toEqual(["http://localhost:3000"]);
});

it("rejects a production environment without JWT_SECRET", () => {
  expect(() =>
    loadEnv({
      ...validProductionEnv,
      JWT_SECRET: undefined
    })
  ).toThrow(/JWT_SECRET/);
});
```

- [ ] **Step 2: Run RED**

```powershell
npm.cmd test -- --run tests/server/env.test.js
```

Expected: canonical-name and development-default tests fail.

- [ ] **Step 3: Refactor `server/config/env.js`**

Parse optional canonical and legacy inputs, then resolve:

```js
const mongodbUri = env.MONGODB_URI || env.MONGO_URI || developmentMongoDefault;
const clientOrigin = env.CLIENT_ORIGIN || env.FRONTEND_URL || developmentOriginDefault;
const whatsappPhone = env.WHATSAPP_PHONE || env.WHATSAPP_NUMBER || "";
```

Return immutable normalized fields:

```js
{
  ...result.data,
  MONGODB_URI: mongodbUri,
  CLIENT_ORIGINS: clientOrigins,
  WHATSAPP_PHONE: whatsappPhone
}
```

Do not return or consume a fallback JWT secret in production. A development
fallback may be explicit and at least 32 characters, accompanied by a warning
outside tests.

- [ ] **Step 4: Update `server/app.js` and `server/server.js` consumers**

- `createCorsOptions` reads `env.CLIENT_ORIGINS`.
- `startServer` calls `connectDatabase(env.MONGODB_URI)`.
- Existing route mounting remains byte-for-byte equivalent in path coverage.

- [ ] **Step 5: Run GREEN**

```powershell
npm.cmd test -- --run tests/server/env.test.js tests/server/app.test.js
```

Expected: both files pass.

## Task 2.2: Improve Database and Stripe Configuration Errors

- [ ] **Step 1: Add failing database error test**

In `tests/server/database.test.js`, inject a rejected `mongoose.connect` and
assert the thrown message contains the MongoDB host and the phrase
`Não foi possível conectar ao MongoDB`, without including credentials.

- [ ] **Step 2: Add failing Stripe route test**

In `tests/server/payments.test.js`, create a checkout service that throws:

```js
Object.assign(new Error("Stripe não está configurado."), {
  status: 503,
  code: "STRIPE_NOT_CONFIGURED"
});
```

Assert the response status is `503`, body error is
`STRIPE_NOT_CONFIGURED`, and body message is clear.

- [ ] **Step 3: Run RED**

```powershell
npm.cmd test -- --run tests/server/database.test.js tests/server/payments.test.js
```

Expected: database message assertion fails; Stripe test may expose any response
format mismatch.

- [ ] **Step 4: Implement minimal backend changes**

- Wrap `mongoose.connect` failure in `server/config/database.js`.
- Redact URI credentials before including the target in the error.
- Keep `getStripeClient()` lazy and throw status `503`, code
  `STRIPE_NOT_CONFIGURED`.
- Do not catch this error in the route; let `errorHandler` serialize it.

- [ ] **Step 5: Run GREEN**

```powershell
npm.cmd test -- --run tests/server/database.test.js tests/server/payments.test.js
```

Expected: both files pass.

## Task 2.3: Normalize Checkout Origins and Browser API URL

- [ ] **Step 1: Update `tests/server/purchases.test.js` to use
  `CLIENT_ORIGINS`**

Assert:

```js
expect(dependencies.createdSessions[0].success_url).toBe(
  "https://gallery.example.com/sucesso.html?session_id={CHECKOUT_SESSION_ID}"
);
expect(dependencies.createdSessions[0].cancel_url).toBe(
  "https://gallery.example.com/cancelado.html?session_id={CHECKOUT_SESSION_ID}"
);
```

- [ ] **Step 2: Create failing `tests/client/api.test.js`**

The test imports the pure exported resolver from `src/lib/api.ts`. Required
content:

```js
import { resolveApiBaseUrl } from "../../src/lib/api";

expect(resolveApiBaseUrl({
  configuredUrl: "https://api.example.com/api/",
  development: false
})).toBe("https://api.example.com/api");

expect(resolveApiBaseUrl({
  configuredUrl: "",
  development: true
})).toBe("http://localhost:3000/api");

expect(resolveApiBaseUrl({
  configuredUrl: "",
  development: false
})).toBe("/api");
```

- [ ] **Step 3: Run RED**

```powershell
npm.cmd test -- --run tests/server/purchases.test.js tests/client/api.test.js
```

Expected: failures because `CLIENT_ORIGINS` and the resolver do not exist.

- [ ] **Step 4: Implement URL normalization**

- Update `server/services/purchases.js` to read
  `env.CLIENT_ORIGINS[0]`.
- Export `resolveApiBaseUrl` from `src/lib/api.ts`.
- Compute the runtime base with
  `import.meta.env.VITE_API_URL` and `import.meta.env.DEV`.
- Preserve `getApiUrl(path)` and its current call sites.

- [ ] **Step 5: Replace hardcoded WhatsApp values**

Add to `src/vite-env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WHATSAPP_PHONE?: string;
}
```

In `App.tsx`, use:

```ts
const whatsappPhone =
  String(import.meta.env.VITE_WHATSAPP_PHONE || "").replace(/\D/g, "");
```

Disable or hide WhatsApp actions when no public number is configured rather
than generating an invalid link.

- [ ] **Step 6: Rewrite `.env.example`**

Include the requested canonical values plus existing media settings:

```dotenv
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/fotografia
JWT_SECRET=troque-esta-chave-por-32-caracteres-ou-mais
JWT_EXPIRES_IN=7d
GALLERY_SESSION_EXPIRES_IN=8h
STRIPE_SECRET_KEY=sk_test_sua_chave
STRIPE_WEBHOOK_SECRET=whsec_sua_chave
CLIENT_ORIGIN=http://localhost:3000
VITE_API_URL=http://localhost:3000/api
WHATSAPP_PHONE=5517999999999
VITE_WHATSAPP_PHONE=5517999999999
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MEDIA_STORAGE=local
MAX_UPLOAD_MB=10
COOKIE_DOMAIN=
LOG_LEVEL=info
```

- [ ] **Step 7: Run Stage 2 verification**

```powershell
npm.cmd test -- --run tests/server/env.test.js tests/server/database.test.js tests/server/app.test.js tests/server/payments.test.js tests/server/purchases.test.js tests/client/api.test.js
npm.cmd run typecheck
npm.cmd run build
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit Stage 2**

```powershell
git add .env.example server/config/env.js server/config/database.js server/server.js server/app.js server/services/stripe.js server/services/purchases.js src/lib/api.ts src/vite-env.d.ts src/App.tsx tests/server/env.test.js tests/server/database.test.js tests/server/app.test.js tests/server/payments.test.js tests/server/purchases.test.js tests/client/api.test.js public/app.html
git commit -m "feat: harden environment configuration"
```

## Manual Validation

1. Start with only development-safe variables; server should use local MongoDB
   and client origin.
2. Run with `NODE_ENV=production` and missing `JWT_SECRET`; startup must stop
   with a clear error.
3. Login from an allowed origin; CORS credentials must work.
4. Remove `STRIPE_SECRET_KEY`, attempt checkout, and verify a visible
   `Stripe não está configurado` response.
5. Build without `VITE_API_URL`; production output must call relative `/api`.

## Stage 2 Completion Criteria

- Canonical names and legacy aliases pass tests.
- No Stripe, JWT, MongoDB, or backend URL is hardcoded in production code.
- Missing production secrets fail clearly.
- Missing Stripe fails at checkout, not as a blank screen.
- Related tests, typecheck, and build pass.

# Stage 3: Private Gallery and Checkout

## Objective

Improve selection, ownership, empty states, totals, checkout feedback, and
mobile purchase UX without changing gallery password or protected media
contracts.

## Files

- Create: `src/lib/gallery.ts`
- Create: `tests/client/gallery.test.js`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `tests/server/gallery-session.test.js`
- Modify: `tests/server/payments.test.js`
- Modify: `tests/server/photo-access.test.js`

## Exact Technical Changes

- Extract pure ownership, selected photo, and total calculations.
- Do not allow already purchased photos to be selected.
- Add gallery empty state when `photos.length === 0`.
- Add explicit `checkoutError` and `checkoutLoading` states.
- Clear checkout error when selection or payment method changes.
- Keep checkout disabled for empty selection and during submission.
- Preserve the `x-gallery-token` header.
- Keep download disabled unless ownership is proven by paid purchase data.
- Make the summary sticky only at desktop widths; render a compact bottom
  summary on mobile without covering controls.

## Risks of Breakage

- Extracted ID normalization can mismatch MongoDB ObjectIds and strings.
- Clearing selection at the wrong time can erase the cart after recoverable
  errors.
- A sticky mobile bar can obscure the gallery close button.
- Checkout error handling can accidentally swallow successful redirect URLs.
- Any gallery-token header regression breaks private access.

## Task 3.1: Extract and Test Gallery Calculations

- [ ] **Step 1: Create `tests/client/gallery.test.js`**

```js
import {
  calculateSelectedTotal,
  collectOwnedPhotoIds,
  selectAvailablePhotos
} from "../../src/lib/gallery";

describe("gallery helpers", () => {
  it("collects only photos from paid purchases", () => {
    const ids = collectOwnedPhotoIds([
      { status: "paid", photoIds: ["1", "2"] },
      { pago: false, status: "pending", photoIds: ["3"] }
    ]);
    expect([...ids]).toEqual(["1", "2"]);
  });

  it("excludes owned photos from the selected cart", () => {
    const photos = [{ _id: "1", preco: 20 }, { _id: "2", preco: 30 }];
    expect(selectAvailablePhotos(photos, ["1", "2"], new Set(["2"]))).toEqual([
      photos[0]
    ]);
  });

  it("calculates the trusted UI summary total", () => {
    expect(calculateSelectedTotal([
      { _id: "1", preco: 20 },
      { _id: "2", preco: 30 }
    ])).toBe(50);
  });
});
```

- [ ] **Step 2: Run RED**

```powershell
npm.cmd test -- --run tests/client/gallery.test.js
```

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement `src/lib/gallery.ts`**

Export typed functions:

```ts
export function collectOwnedPhotoIds(purchases: PurchaseLike[]): Set<string>
export function selectAvailablePhotos(
  photos: PhotoLike[],
  selectedIds: string[],
  ownedIds: Set<string>
): PhotoLike[]
export function calculateSelectedTotal(photos: PhotoLike[]): number
```

Normalize every identifier with `String(value)`.

- [ ] **Step 4: Update `App.tsx` to use the helpers**

Replace inline `ownedPhotoIds`, `selectedPhotos`, and `selectedTotal`
calculations. Update `togglePhoto` to return early for owned IDs.

- [ ] **Step 5: Run GREEN**

```powershell
npm.cmd test -- --run tests/client/gallery.test.js
```

Expected: all helper tests pass.

## Task 3.2: Add Gallery States and Checkout Feedback

- [ ] **Step 1: Extend the client structural test**

Add assertions to `tests/client/gallery.test.js` by reading `src/App.tsx` and
checking for:

- `Nenhuma foto disponível nesta galeria`
- `checkoutError`
- `checkoutLoading`
- `disabled={!selectedPhotoIds.length || checkoutLoading}`
- `x-gallery-token`
- `Comprar por WhatsApp`

- [ ] **Step 2: Run RED**

Expected: fail on empty state and checkout state strings.

- [ ] **Step 3: Implement UI behavior in `src/App.tsx`**

Add:

```ts
const [checkoutError, setCheckoutError] = useState("");
const [checkoutLoading, setCheckoutLoading] = useState(false);
```

Wrap checkout in `try/catch/finally`, set the server message on failure, and
navigate only when `data.url` is a non-empty string.

For zero photos, render a centered empty card with gallery title, explanation,
refresh action, and close action.

For owned photos:

- Badge: `Comprada`
- Selection action removed or disabled.
- Download action enabled.

For available photos:

- Badge: `Disponível` or `Selecionada`
- Price and selection action visible.
- Download disabled.

- [ ] **Step 4: Add responsive summary styles**

Use desktop `xl:sticky xl:top-24`. Add a mobile summary with safe-area bottom
padding and do not render duplicate checkout buttons simultaneously above
`xl`.

- [ ] **Step 5: Re-run protected-flow tests**

```powershell
npm.cmd test -- --run tests/client/gallery.test.js tests/server/gallery-session.test.js tests/server/payments.test.js tests/server/photo-access.test.js
```

Expected: all files pass.

- [ ] **Step 6: Run typecheck and build**

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Expected: both exit 0.

- [ ] **Step 7: Commit Stage 3**

```powershell
git add src/lib/gallery.ts src/App.tsx src/styles.css tests/client/gallery.test.js tests/server/gallery-session.test.js tests/server/payments.test.js tests/server/photo-access.test.js public/app.html
git commit -m "feat: improve private gallery checkout ux"
```

## Manual Validation

1. Enter a valid gallery code and verify the existing password flow.
2. Open a gallery with no photos and inspect the empty state.
3. Select and remove multiple photos; verify count and total.
4. Confirm purchased photos cannot re-enter the cart.
5. Attempt checkout with an empty cart; button remains disabled.
6. Remove Stripe configuration and verify the inline error.
7. Confirm valid checkout still redirects to Stripe.
8. Verify paid download behavior and gallery token media requests.
9. Check the gallery at 360px and desktop widths.

## Stage 3 Completion Criteria

- Password access and token headers are unchanged.
- Empty, selected, purchased, loading, and error states are clear.
- Checkout cannot run with an empty cart.
- Stripe errors are visible and successful redirects still work.
- Focused server/client tests, typecheck, and build pass.

# Stage 4: Administration Panel

## Objective

Improve hierarchy, forms, actions, states, and feedback in the current admin
panel without changing endpoint contracts or authentication.

## Files

- Create: `src/components/admin/AdminFeedback.tsx`
- Create: `src/components/admin/AdminStatCard.tsx`
- Create: `tests/client/admin-panel.test.js`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `tests/server/auth.test.js`
- Modify: `tests/server/upload.test.js`

## Exact Technical Changes

- Keep admin orchestration and API handlers in `App.tsx`.
- Extract only stat and feedback presentation components.
- Add `adminSuccess` state alongside existing `adminError`.
- Wrap save, upload, status, edit, and delete actions with localized feedback.
- Add labels to every admin input and select.
- Group sections: overview, galleries, access codes, uploads, orders.
- Restore visible `Editar`, `Ativar/Inativar`, and `Excluir` actions in list
  rows using existing functions.
- Add confirmation with `window.confirm` before destructive deletes.
- Remove the text implying a hardcoded `login 123`.
- Keep `openAdminPage`, `refreshAdminOverview`, `saveGallery`, `saveCode`,
  `uploadPhoto`, `updateGalleryStatus`, `deleteGallery`, `deleteCode`, and
  `toggleCodeActive` signatures.

## Risks of Breakage

- Moving handlers into child components can create stale closures; handlers
  therefore remain in `App.tsx`.
- Forms without `type="button"` can submit unexpectedly.
- Optimistic feedback before a response can report false success.
- Deletion controls can call the wrong ID if gallery and code rows share UI.
- Admin role checks must remain server-enforced and client-gated.

## Task 4.1: Lock Admin Action Wiring

- [ ] **Step 1: Create `tests/client/admin-panel.test.js`**

Read `src/App.tsx` and assert presence of:

```js
expect(source).toContain("Painel administrativo");
expect(source).toContain("Ativar");
expect(source).toContain("Inativar");
expect(source).toContain("Editar");
expect(source).toContain("Excluir");
expect(source).toContain("adminSuccess");
expect(source).toContain("saveGallery");
expect(source).toContain("saveCode");
expect(source).toContain("uploadPhoto");
expect(source).toContain("updateGalleryStatus");
expect(source).toContain("deleteGallery");
expect(source).toContain("deleteCode");
```

Also assert:

```js
expect(source).not.toContain("login 123");
```

- [ ] **Step 2: Run RED**

```powershell
npm.cmd test -- --run tests/client/admin-panel.test.js
```

Expected: fail because required actions/feedback are not all visible.

## Task 4.2: Add Focused Admin Presentation Components

- [ ] **Step 1: Create `src/components/admin/AdminStatCard.tsx`**

Props:

```ts
interface AdminStatCardProps {
  label: string;
  value: number;
  tone?: "neutral" | "accent" | "success";
}
```

Render a semantic article with high-contrast value and restrained tone.

- [ ] **Step 2: Create `src/components/admin/AdminFeedback.tsx`**

Props:

```ts
interface AdminFeedbackProps {
  error: string;
  success: string;
  onDismiss: () => void;
}
```

Render `role="alert"` for error and `role="status"` for success.

- [ ] **Step 3: Integrate components and feedback in `App.tsx`**

Only set success after `response.ok` and refresh completion. On any failed
response, parse server JSON and set `adminError`.

Action labels:

- Active gallery: `Inativar`
- Draft/archived gallery: `Ativar`
- Gallery edit: `Editar`
- Gallery delete: `Excluir`
- Active code: `Inativar`
- Inactive code: `Ativar`
- Code edit: `Editar`
- Code delete: `Excluir`

- [ ] **Step 4: Organize forms and empty states**

Each input receives a visible `<label>`. Lists render explicit empty messages:

- `Nenhuma galeria criada.`
- `Nenhum código criado.`
- `Nenhum pedido encontrado.`

Keep current payload shapes and endpoint paths unchanged.

- [ ] **Step 5: Run client and security tests**

```powershell
npm.cmd test -- --run tests/client/admin-panel.test.js tests/server/auth.test.js tests/server/upload.test.js
```

Expected: all pass.

- [ ] **Step 6: Run typecheck and build**

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Expected: both exit 0.

- [ ] **Step 7: Commit Stage 4**

```powershell
git add src/components/admin/AdminFeedback.tsx src/components/admin/AdminStatCard.tsx src/App.tsx src/styles.css tests/client/admin-panel.test.js tests/server/auth.test.js tests/server/upload.test.js public/app.html
git commit -m "feat: refine administration workspace"
```

## Manual Validation

1. Create or use an admin via `npm.cmd run create-admin`.
2. Login through the normal modal; no development secret appears in the UI.
3. Open the admin page and verify statistics.
4. Create and edit a gallery.
5. Activate/inactivate and delete a gallery after confirmation.
6. Create, edit, activate/inactivate, and delete an access code.
7. Upload a valid image and verify success feedback.
8. Attempt invalid upload and verify server error feedback.
9. Inspect empty order/gallery/code states.
10. Repeat the panel check at tablet and desktop widths.

## Stage 4 Completion Criteria

- All existing admin actions remain functional.
- Every form field is labeled.
- Success and error states are explicit.
- Destructive actions require confirmation.
- Authentication and upload tests, client tests, typecheck, and build pass.

# Stage 5: README, Cleanup, and Final Validation

## Objective

Document the real product and deployment model, prevent future generated-file
accumulation, remove only verified obsolete artifacts, and run the complete
validation matrix.

## Files

- Modify: `README.md`
- Modify: `.gitignore`
- Verify only: `public/app.html`
- Verify only: `public/index.html`
- Verify only: `public/sucesso.html`
- Verify only: `public/cancelado.html`
- Create: `uploads/.gitkeep`
- Review tracked files: `public/assets/*`
- Modify only if needed: `package.json`

## Exact Technical Changes

- README sections: overview, features, architecture, stack, requirements,
  installation, environment, development admin, customer flow, admin flow,
  payment/webhook flow, media storage, scripts, production security, and
  project status.
- Do not publish credentials; document `npm run create-admin`.
- `.gitignore` must retain `.env.example` and `uploads/.gitkeep`.
- Ignore future `public/assets/` output.
- Use `git ls-files public/assets` before any deletion.
- Remove tracked old bundles only when:
  1. They are not referenced by any static HTML.
  2. A fresh build produces the current referenced bundle.
  3. `npm run build` and static page smoke checks pass afterward.
- Do not remove `app.html`, `index.html`, `sucesso.html`, or `cancelado.html`.

## Risks of Breakage

- Deleting a currently referenced hashed asset breaks the deployed static app.
- Ignoring `public/assets` does not automatically untrack existing files.
- Documentation can drift from actual script behavior.
- `npm start` currently starts the server and must not be documented as a build
  command unless the script is intentionally and separately changed.

## Task 5.1: Write the Professional README

- [ ] **Step 1: Replace `README.md`**

Document exact commands:

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run create-admin
npm.cmd run dev
npm.cmd run dev:server
npm.cmd run build
npm.cmd start
```

Explain that `npm start` serves the backend and existing built frontend assets;
run `npm run build` before production start.

- [ ] **Step 2: Document required production values**

Explicitly call out:

- Strong `JWT_SECRET`
- Real `MONGODB_URI`
- Stripe secret and webhook secret
- Production `CLIENT_ORIGIN`
- Cloudinary values with `MEDIA_STORAGE=cloudinary`
- Public `VITE_API_URL`
- Public WhatsApp number mirror

## Task 5.2: Update Ignore Rules and Audit Generated Assets

- [ ] **Step 1: Replace `.gitignore` with the complete policy**

```gitignore
node_modules/

.env
.env.*
!.env.example

dist/
coverage/
public/assets/

uploads/*
!uploads/.gitkeep

logs/
*.log
.DS_Store
.superpowers/
```

- [ ] **Step 2: Create the upload directory marker**

Create an empty `uploads/.gitkeep`. Confirm `git check-ignore
uploads/.gitkeep` does not report the file as ignored.

- [ ] **Step 3: Audit tracked output**

Run:

```powershell
git ls-files public/assets
rg -n "public/assets|assets/" public/*.html app.html index.html
```

Record which hashes are referenced.

- [ ] **Step 4: Preserve generated bundles unless Git proves they are tracked**

The current baseline returns no tracked files from
`git ls-files public/assets`. If that remains true, delete nothing from
`public/assets`; the ignore rule is sufficient to prevent future accumulation
in commits. If the command returns tracked files during execution, stop Stage 5
and update this plan with the exact filenames and HTML references before any
deletion.

## Task 5.3: Full Verification

- [ ] **Step 1: Run all automated tests**

```powershell
npm.cmd test
```

Expected: all test files pass with zero failures.

- [ ] **Step 2: Run TypeScript**

```powershell
npm.cmd run typecheck
```

Expected: exit 0 with no diagnostics.

- [ ] **Step 3: Run final production build**

```powershell
npm.cmd run build
```

Expected: Vite exits 0 and writes current bundles plus `public/app.html`.

- [ ] **Step 4: Smoke-test backend startup**

With local MongoDB available and `.env` configured:

```powershell
npm.cmd start
```

Verify:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/health
```

Expected: HTTP 200 and `success: true`.

- [ ] **Step 5: Smoke-test frontend development server**

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL and `app.html` loads without a module error.

- [ ] **Step 6: Manual end-to-end checklist**

Verify:

1. Home loads at 360px and desktop.
2. `Acessar Galeria` opens the code modal.
3. `Conhecer experiência` scrolls to the process section.
4. Login modal opens and admin login succeeds.
5. Admin gallery/code/upload actions work.
6. A valid gallery code opens the private gallery.
7. Photo selection and total work.
8. Empty checkout is disabled.
9. Missing Stripe produces a visible error.
10. Configured Stripe creates a checkout URL.
11. Paid photos show download access; unpaid photos do not.
12. Static success and cancellation pages load.

- [ ] **Step 7: Inspect final repository state**

```powershell
git status --short
git diff --check
git diff --stat
```

Expected: only intentional Stage 5 changes, no whitespace errors, no secrets.

- [ ] **Step 8: Commit Stage 5**

```powershell
git add README.md .gitignore public/app.html uploads/.gitkeep
git commit -m "docs: finalize premium platform delivery"
```

## Manual Validation

Use the complete checklist in Task 5.3 and record any environment-dependent
checks that could not run, including the exact missing service.

## Stage 5 Completion Criteria

- README matches actual scripts and architecture.
- `.gitignore` protects secrets, uploads, logs, and future generated bundles.
- No essential static page is deleted.
- No secret appears in tracked files.
- Complete tests, typecheck, build, frontend smoke, and backend smoke pass, or
  an external service limitation is reported with exact evidence.
- Final report lists every changed file by stage and all required `.env`
  configuration.

## Approval Gate

Do not execute this plan until the user explicitly approves it. After approval,
choose one execution mode:

1. Subagent-driven development with review after each task.
2. Inline execution with a hard checkpoint and user report after each stage.
