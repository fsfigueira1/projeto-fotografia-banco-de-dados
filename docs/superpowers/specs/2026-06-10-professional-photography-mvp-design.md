# Professional Photography MVP Design

## Objective

Transform the current photography prototype into a secure, deployable, commercially presentable MVP for photographers. Preserve the existing private-gallery, admin, upload, photo-selection, service-purchase, and Stripe capabilities while replacing unsafe or incomplete implementations.

## Delivery Strategy

Use an incremental modular modernization instead of a full rewrite. The work is divided into five ordered phases so every phase leaves the repository buildable and reduces risk for the next one.

1. Production foundation, security, database, authentication, and API conventions.
2. Stripe checkout, verified webhooks, purchases, and image authorization.
3. Cloudinary media storage, uploads, and model hardening.
4. Modular premium frontend, private gallery, cart, lightbox, and admin dashboard.
5. Automated verification, deployment configuration, and professional documentation.

## Runtime Architecture

### Frontend

- React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, GSAP, and Lenis.
- Deployable to Vercel as a static Vite application.
- Uses `VITE_API_URL` for the backend origin.
- Sends authenticated API requests with `credentials: "include"`.
- Keeps gallery access tokens in session storage because gallery access is separate from account authentication and expires quickly.
- Splits the current monolithic `App.tsx` into focused feature components and API modules.

### Backend

- Express 5 application deployable to Render or Railway.
- API routes are mounted under `/api`.
- MongoDB Atlas via `MONGO_URI`.
- Cloudinary stores production originals and derived preview assets.
- Stripe is the only online payment provider in this MVP.
- Authentication uses a signed JWT in an HttpOnly cookie.

### Persistence

- MongoDB stores users, galleries, access codes, photo metadata, and purchases.
- Cloudinary stores image files.
- Local disk storage is available only in development when explicitly configured.
- Production startup rejects local storage configuration.

## Database

- MongoDB connects only through validated `MONGO_URI`, including MongoDB Atlas connection strings.
- Server startup waits for a successful database connection before listening for traffic.
- Connection failure logs a concise development diagnostic and exits with a nonzero status.
- Production logs do not expose credentials or the complete connection string.
- Models use timestamps, required fields, enums, nonnegative numeric validation, and indexes for common lookup paths.
- References are stored as MongoDB object IDs where the related collection is controlled by this application.
- A migration script converts compatible legacy string references and purchase statuses without deleting source records.

## Configuration

Server configuration is loaded and validated once at startup. Missing required production variables stop startup with a clear list of errors.

Required server variables:

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `MEDIA_STORAGE`

Optional server variables:

- `JWT_EXPIRES_IN`
- `GALLERY_SESSION_EXPIRES_IN`
- `COOKIE_DOMAIN`
- `MAX_UPLOAD_MB`
- `LOG_LEVEL`
- `WHATSAPP_NUMBER`

Frontend variable:

- `VITE_API_URL`

`.env` and environment-specific variants are ignored. `.env.example` documents safe placeholders only.

## Security

### Application Security

- Add Helmet with production-safe defaults.
- Restrict CORS to the parsed `FRONTEND_URL` allowlist and permit credentials.
- Add global API rate limiting and stricter authentication/gallery-code limiters.
- Limit JSON body size.
- Validate and normalize request input using Zod schemas.
- Use centralized not-found and error middleware.
- Avoid leaking stack traces or internal database errors in production.

### Authentication

- Remove all fixed users, test credentials, frontend bypasses, and insecure JWT fallback values.
- Registration creates client accounts only.
- Login validates credentials using bcrypt and sets the HttpOnly authentication cookie.
- `/api/auth/me` returns the authenticated user.
- `/api/auth/logout` clears the cookie.
- Administrative routes require both a valid authenticated user and `role: "admin"`.
- The first administrator is created or promoted through `npm run create-admin`, with email and password entered interactively.

Cookie behavior:

- `httpOnly: true`
- `secure: true` in production
- `sameSite: "none"` in cross-site production deployment
- `sameSite: "lax"` in local development
- bounded `maxAge` matching JWT expiration

### Gallery Authorization

- Access codes remain bcrypt hashes.
- A valid code creates a short-lived gallery token scoped to one gallery and one access-code record.
- Every gallery and media request verifies that scope.
- Gallery purchases returned to a visitor are filtered to the access-code/customer scope, never every paid purchase in the gallery.
- Public endpoints never accept arbitrary `userId` as authorization.

## API Convention

All JSON endpoints return:

```json
{
  "success": true,
  "data": {},
  "message": "Human-readable result",
  "error": null
}
```

Failures use:

```json
{
  "success": false,
  "data": null,
  "message": "Human-readable failure",
  "error": "STABLE_ERROR_CODE"
}
```

HTTP status codes distinguish validation, authentication, authorization, missing resources, conflicts, rate limits, and server errors.

Primary route groups:

- `/api/health`
- `/api/auth`
- `/api/admin`
- `/api/galleries`
- `/api/photos`
- `/api/payments`
- `/api/webhooks/stripe`
- `/api/media`

## Domain Models

### User

- Required name, unique email, password hash, and role.
- Roles: `client`, `admin`.
- Timestamps enabled.
- Password hash excluded from normal query serialization.

### Gallery

- Required title, unique slug, status, and creator.
- Statuses: `draft`, `active`, `archived`.
- Customer metadata and event date remain optional.
- Stores cover photo reference but does not duplicate a potentially unbounded photo ID list.
- Timestamps enabled.

### AccessCode

- Required gallery reference and code hash.
- Active flag, optional expiration, usage timestamps, customer metadata, and creator.
- Timestamps enabled.

### Photo

- Required gallery reference, owner/creator reference, storage provider, provider asset ID, preview URL metadata, and nonnegative price.
- Tracks whether access is private and whether download requires payment.
- Timestamps enabled.

### Purchase

- Required buyer, type, total, currency, Stripe session ID, and status.
- Statuses: `pending`, `paid`, `failed`, `canceled`.
- References selected photos, gallery, and access code where applicable.
- Stores Stripe payment intent, payment method, paid timestamp, and failure/cancellation timestamps.
- Timestamps enabled.

## Payments

- Checkout requires an authenticated user.
- Photo checkout additionally requires a valid gallery session scoped to the selected gallery.
- The server loads photos from MongoDB, verifies all belong to the authorized gallery, calculates totals, and ignores frontend prices.
- Stripe Checkout uses `FRONTEND_URL` success and cancellation routes.
- Card, Pix, and boleto are offered only when supported by Stripe and configured account capabilities.
- A pending purchase is created before returning the Checkout URL.
- The success page only polls purchase status; it never marks a purchase as paid.
- Stripe webhook handling uses `express.raw`, `STRIPE_WEBHOOK_SECRET`, and signature verification.
- `checkout.session.completed` marks a purchase paid only when Stripe reports payment completed.
- Async success/failure and expiration events transition purchases idempotently.
- Purchased photo access is derived from paid purchases only.

## Media And Image Protection

### Uploads

- Admin upload accepts image files only.
- Validate MIME type and maximum size.
- Production uploads go to Cloudinary through a media service abstraction.
- Local development may write to `uploads/` when `MEDIA_STORAGE=local`.
- Upload errors remove temporary files and do not create partial database records.

### Delivery

- Unpaid visitors receive watermarked, lower-resolution Cloudinary preview URLs.
- Paid users receive short-lived signed delivery URLs for purchased assets.
- Gallery tokens cannot request assets outside their gallery.
- Original Cloudinary public IDs and secrets are not exposed unnecessarily.
- Browser-level protection is described as deterrence, not absolute DRM.

## Frontend Experience

### Public Home

- Premium editorial design centered on Jungle (`#1A4731`) and Cream Soda (`#FFF4CC`).
- Jungle and darker derived greens define backgrounds, panels, overlays, and structural surfaces.
- Cream Soda and lower-opacity derived tones define primary text, icons, borders, and conversion actions.
- Error, warning, and success states retain restrained semantic colors for accessibility.
- Legacy red accents are removed from the product identity.
- Strong hero, benefits, how-it-works, photographer-oriented section, services, and conversion CTA.
- Restrained reveal and hover animation.
- GSAP/Lenis effects are limited to sections where they improve the experience and disabled for reduced motion.

### Header

- Desktop uses the approved expandable-tabs navigation.
- Mobile uses a clear vertical menu with large touch targets.
- Brand, gallery access, login/profile, admin access, and logout remain available according to state.

### Private Gallery

- Elegant code-entry state with loading and error feedback.
- Premium responsive photo grid.
- Watermark treatment on unpaid previews.
- Accessible lightbox for photo inspection.
- Selection state and sticky/responsive cart show count and server-derived estimated total.
- Checkout action has explicit loading and failure states.
- Paid photos are labeled and expose a protected download action.

### Admin

- Responsive dashboard with gallery, photo, purchase, paid-order, and revenue summaries.
- Create, edit, archive, and delete galleries with confirmation.
- Generate, edit, activate, and revoke access codes.
- Upload photos with progress and validation feedback.
- Set prices and inspect purchase/payment statuses.
- The UI never relies on an email literal to identify administrators.

## Code Organization

Backend boundaries:

- `server/config`: environment parsing and runtime configuration.
- `server/middleware`: authentication, validation, rate limiting, errors.
- `server/services`: Stripe, media, authentication, gallery access, purchases.
- `server/controllers`: HTTP translation only.
- `routes`: route composition.
- `models`: persistence schemas.

Frontend boundaries:

- `src/api`: typed API client and feature endpoints.
- `src/features/auth`
- `src/features/home`
- `src/features/gallery`
- `src/features/admin`
- `src/features/payments`
- `src/components/ui`
- `src/types`

Dead legacy static JavaScript/CSS is removed after the React application fully owns the corresponding routes.

## Testing

Use Vitest and React Testing Library for frontend units and components. Use Node's test runner or Vitest with Supertest and an isolated MongoDB test database for backend HTTP behavior.

Required automated coverage:

- environment validation,
- registration/login/logout/me,
- role authorization,
- gallery-code validation and scope,
- checkout input and server-side total calculation,
- Stripe webhook signature handling and idempotent state changes,
- protected photo ownership,
- API client envelope handling,
- gallery selection/cart behavior,
- admin conditional navigation.

Final verification:

- clean dependency install,
- automated test suite,
- TypeScript checking,
- production frontend build,
- backend startup with valid test configuration,
- backend startup rejection with missing production configuration,
- documented manual Stripe CLI webhook test,
- documented Cloudinary upload smoke test.

## Deployment

### Vercel

- Builds the Vite frontend.
- Uses SPA rewrites for application routes.
- Configures `VITE_API_URL` with the Render/Railway backend URL.

### Render Or Railway

- Installs dependencies and starts the Express server without rebuilding the frontend.
- Uses Atlas, Stripe, Cloudinary, and frontend-origin variables.
- Exposes `/api/health`.
- Uses persistent external media storage, never ephemeral disk in production.

## Documentation

Rewrite the README with:

- professional product description,
- screenshot placeholders,
- features and technology,
- repository structure,
- local setup,
- environment reference,
- MongoDB Atlas, Cloudinary, and Stripe setup,
- admin bootstrap,
- API routes,
- user and admin flows,
- Vercel plus Render/Railway deployment,
- webhook testing,
- roadmap,
- suggested commercial positioning around R$ 8,000 or more,
- author credit to Felipe Figueira Silva.

## Compatibility And Migration

- Existing collection names remain compatible where practical.
- Schema changes tolerate legacy records long enough for an explicit migration script to normalize them.
- No existing functionality is removed without a working replacement.
- The uncommitted `public/index.html` change is preserved and not overwritten blindly.
- Generated assets, logs, local uploads, `.env` files, and visual-companion state are removed from version control or ignored as appropriate.

## Acceptance Criteria

- No committed secret or fixed admin credential remains.
- Production refuses missing critical configuration.
- Authentication and admin authorization do not depend on frontend state.
- Stripe alone controls paid status through verified webhooks.
- Private gallery and media requests are gallery-scoped.
- Cloudinary supports production uploads and protected derived delivery.
- Frontend uses `VITE_API_URL`, handles loading/error states, and is responsive.
- Admin and private-gallery workflows remain available with improved UX.
- Automated tests and `npm run build` pass.
- README documents a reproducible local and deployment setup.
