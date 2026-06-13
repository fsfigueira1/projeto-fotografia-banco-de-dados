# Premium Product Platform Design

## Objective

Evolve the existing photography and events platform into a polished, sellable
product while preserving all current customer, gallery, administration,
payment, media, and authentication flows.

Work proceeds through five testable stages. A stage cannot begin until the
previous stage passes its focused tests, TypeScript checks where applicable,
and `npm run build`.

## Constraints

- Preserve existing route families and aliases for authentication, galleries,
  media, uploads, photos, payments, and webhooks.
- Keep the current React, TypeScript, Vite, Express, MongoDB, Stripe, Cloudinary,
  Framer Motion, GSAP, Lenis, Lucide, Tailwind, Vitest, and Supertest stack.
- Add no Three.js, React Three Fiber, or unnecessary dependencies.
- Preserve gallery password access, admin development login, photo upload,
  service purchase, photo selection, checkout, webhook approval, and protected
  download behavior.
- Keep secrets and deployment URLs outside source control.
- Respect `prefers-reduced-motion`, mobile constraints, and accessible button
  behavior.
- Do not delete static success, cancellation, app, or index pages unless a
  verified replacement exists.

## Existing Architecture

The repository already contains a production-oriented backend architecture:

- `server/config/env.js` validates and centralizes environment configuration.
- `server/config/database.js` owns MongoDB connection behavior.
- `server/services/stripe.js`, `purchases.js`, and `stripe-webhook.js` isolate
  payment responsibilities.
- `server/app.js` mounts canonical `/api/*` routes plus Portuguese and English
  aliases.
- Server behavior is covered by focused Vitest and Supertest tests.

The implementation must extend this architecture rather than regress to direct
`process.env` reads scattered across routes.

## Stage 1: Premium Product Landing

### Visual Direction

Use direction A, "Produto premium", as the final composition:

- Black background with a subtle grid and restrained red glow.
- Desktop hero split into two columns, commercial copy on the left and a camera
  visual on the right.
- Strong typography influenced by editorial campaigns, without adopting the
  editorial layout.
- Atmospheric depth influenced by cinematic work, without obscuring the product
  proposition.

### Navigation

The public navigation displays `FAUZI EVENTOS` and compact links for:

- `Galeria`, which opens the private gallery access flow.
- `Serviços`, which scrolls to the services section.
- `Login`, which opens the existing login modal.

Mobile navigation remains compact and must not create horizontal overflow.

### Hero

The exact content is:

- Eyebrow: `GALERIA PRIVADA PREMIUM`
- Headline: `Fotografia de eventos com compra segura`
- Supporting copy: `Galerias privadas por senha, seleção de favoritas e
  download liberado após aprovação do pagamento.`
- Primary action: `Acessar Galeria`
- Secondary action: `Conhecer experiência`

The primary action calls `openGalleryAccess`. The secondary action scrolls to
the experience section and does not open authentication.

The camera visual first attempts local sources in this order:

1. `/images/camera-hero.png`
2. `/img/camera-hero.png`
3. `/camera-hero.png`

If none loads, a CSS camera mock remains visible. The visual uses subtle
floating motion, deep shadow, restrained red glow, and mouse tilt on capable
desktop pointers. It uses no Canvas or WebGL.

### Hero Feature Cards

Three populated cards appear under the main hero content:

1. `Acesso por senha`: each customer receives an exclusive gallery code.
2. `Compra individual`: customers select and purchase only desired photos.
3. `Entrega segura`: downloads become available after payment confirmation.

The first card receives a slightly stronger red accent. All cards use subtle
hover elevation and visible keyboard focus.

### Home Sections

The landing contains these sections in order:

1. Four-step experience flow:
   `Contratação do serviço`, `Criação da galeria privada`, `Acesso por senha`,
   and `Seleção, pagamento e download`.
2. Services using the existing `services` data and
   `openServicePurchase(service)` behavior.
3. Differentiators for password access, admin panel, uploads, secure checkout,
   per-photo purchase, and responsive experience.
4. Final gallery call to action with `Acessar Galeria` and conditional
   `Painel admin`.

Section entry animations use Framer Motion. GSAP and Lenis remain optional only
where their current integration is stable and cleanup is reliable. Mobile and
reduced-motion users receive reduced animation.

### Landing Verification

- Structural tests verify exact hero copy, both button labels, their handlers,
  the experience anchor, service action, and non-Canvas fallback.
- TypeScript check passes.
- Production build passes.
- A local browser smoke check covers 360px, tablet, and desktop layouts.

## Stage 2: Configuration and Security

### Environment Contract

`.env.example` documents:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GALLERY_SESSION_EXPIRES_IN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLIENT_ORIGIN`
- `VITE_API_URL`
- `WHATSAPP_PHONE`

It may also retain documented media settings required by the existing
Cloudinary/local storage architecture.

### Compatibility

The configuration layer accepts both:

- `MONGODB_URI` and the legacy `MONGO_URI`
- `CLIENT_ORIGIN` and the legacy `FRONTEND_URL`
- `WHATSAPP_PHONE` and the legacy `WHATSAPP_NUMBER`

The new names are canonical in documentation. Legacy aliases remain supported
to avoid breaking existing environments and tests.

Development defaults are allowed only for local development:

- MongoDB: `mongodb://127.0.0.1:27017/fotografia`
- Client origin: `http://localhost:3000`
- API URL in the browser: `http://localhost:3000/api`

Production requires explicit secrets and infrastructure settings. Missing
`JWT_SECRET` produces a clear startup error. Missing Stripe configuration
produces a clear checkout error rather than a blank page.

### Browser API URL

`src/lib/api.ts` follows this precedence:

1. Explicit `VITE_API_URL`
2. Relative `/api` in production or same-origin deployments
3. `http://localhost:3000/api` in development

The helper normalizes trailing and leading slashes.

### Security Verification

Tests cover aliases, development defaults, production requirements, Stripe
configuration errors, client origin checkout URLs, and API URL normalization.
The complete server test suite and build must pass.

## Stage 3: Gallery and Checkout UX

### Gallery

The current password/code session remains unchanged. The gallery view gains:

- A polished empty state when no photos exist.
- Responsive photo cards showing image, price, ownership status, and selection
  control.
- Clear distinction between purchased and available photos.
- A visible desktop summary and a compact mobile summary.
- Disabled checkout when the selection is empty.
- Clear loading and checkout errors presented inside the interface.
- WhatsApp as an alternative purchase path, using configured contact data.

Purchased photo download remains protected by backend authorization.

### Checkout

The frontend consumes the existing payment endpoint and displays server errors.
When Stripe is missing, the backend responds with an explicit service error and
the UI renders that message without navigating or blanking the page.

### Gallery Verification

Tests cover empty selection, total calculation, purchased state, empty gallery,
Stripe-not-configured response, and preservation of password access behavior.
Build must pass before admin work begins.

## Stage 4: Administration UX

The admin page keeps all existing API calls and actions while improving:

- Statistics hierarchy and labels.
- Form grouping, field labels, and responsive layout.
- Success and error feedback.
- Visibility and distinction of `Ativar/Inativar`, `Editar`, and `Excluir`.
- Gallery, code, upload, and order sections.
- Empty and loading states.

No endpoint payload or authentication contract changes solely for visual work.
Development admin login remains available through the documented admin creation
script and regular login form; no credential is embedded in the client.

Admin tests cover action wiring and key states. TypeScript and build must pass.

## Stage 5: Documentation and Repository Hygiene

### README

The README documents:

- Product summary and capabilities.
- Technology stack.
- Local installation and startup.
- Environment variables and aliases.
- Development admin creation and login flow.
- Customer, gallery, checkout, payment approval, and download flow.
- Admin workflow.
- Production security checklist.
- Current development status and future screenshots.

No real development password is committed.

### Git Ignore and Generated Assets

`.gitignore` includes:

- `node_modules/`
- `.env` and environment variants except `.env.example`
- `uploads/*` with `!uploads/.gitkeep`
- `dist/`
- logs and `*.log`
- `public/assets/`
- `.DS_Store`
- local brainstorming artifacts

Existing tracked build files are reviewed before any removal. The final cleanup
only removes clearly generated, obsolete assets when the current app and static
pages still function without them.

### Final Verification

Run:

- Focused client tests
- Complete server tests
- `npm run typecheck`
- `npm run build`
- Server startup smoke check with development configuration
- Frontend development server smoke check
- Route and interaction checks for gallery access, experience scroll, login,
  admin access, checkout error handling, and protected media

Each stage report includes changed files, improvements, build status, and
required environment configuration.

## Error Handling

- Server errors retain the existing structured response middleware.
- Missing infrastructure configuration returns explicit error codes and human
  messages.
- UI actions catch errors and show localized feedback near the initiating
  control.
- Animation setup is optional enhancement; failure to initialize motion cannot
  hide core content or block scrolling.
- Local camera image failure always falls back to the CSS visual.

## Testing Strategy

Behavior changes use red-green-refactor:

1. Add or update a focused failing test.
2. Verify that it fails for the intended missing behavior.
3. Implement the smallest compatible change.
4. Run the focused test.
5. Run related tests, typecheck, and build.

Configuration-only and documentation changes receive parser or contract tests
where behavior exists. Pure style changes receive structural and browser smoke
verification rather than brittle pixel snapshots.

