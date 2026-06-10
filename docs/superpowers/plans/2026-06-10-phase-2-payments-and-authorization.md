# Phase 2 Payments And Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make purchase and private-gallery authorization server-owned, with Stripe checkout totals calculated from MongoDB and paid status controlled only by signed webhooks.

**Architecture:** Introduce injectable purchase and Stripe services behind thin Express routers. Harden domain schemas while tolerating legacy records, then migrate gallery and photo reads so ownership comes from authenticated users, paid purchases, and scoped gallery sessions rather than request-supplied user IDs.

**Tech Stack:** Express 5, Mongoose, Stripe, Zod, Vitest, Supertest

---

### Task 1: Harden Gallery, AccessCode, Photo, And Purchase Schemas

**Files:**
- Modify: `models/Gallery.js`
- Modify: `models/AccessCode.js`
- Modify: `models/Foto.js`
- Modify: `models/Compra.js`
- Create: `tests/server/models.test.js`

- [ ] Write tests for required fields, enums, nonnegative price/total, timestamps, and purchase statuses.
- [ ] Run the model tests and verify they fail against current schemas.
- [ ] Add ObjectId-compatible references while retaining legacy string compatibility where required.
- [ ] Remove the unbounded duplicated `photoIds` list from new gallery writes.
- [ ] Add purchase timestamps and statuses `pending`, `paid`, `failed`, `canceled`.
- [ ] Run the model tests and verify they pass.

### Task 2: Create Stripe And Purchase Services

**Files:**
- Create: `server/services/stripe.js`
- Create: `server/services/purchases.js`
- Create: `tests/server/purchases.test.js`

- [ ] Write failing service tests for server-side totals, gallery ownership validation, and pending purchase creation.
- [ ] Implement a lazy Stripe client from validated configuration.
- [ ] Implement photo checkout preparation that rejects missing, foreign-gallery, or duplicate photo IDs.
- [ ] Implement service checkout preparation from the server-owned service catalog.
- [ ] Persist a pending purchase before returning the Checkout URL.
- [ ] Run service tests and verify they pass.

### Task 3: Rewrite Payment Routes

**Files:**
- Modify: `routes/pagamentos.js`
- Create: `tests/server/payments.test.js`

- [ ] Write failing HTTP tests proving checkout requires authentication.
- [ ] Prove photo checkout requires a gallery token scoped to the selected gallery.
- [ ] Prove frontend prices and user IDs are ignored.
- [ ] Return the standard API envelope.
- [ ] Expose authenticated purchase status without mutating it.
- [ ] Run payment route tests and verify they pass.

### Task 4: Verify Stripe Webhooks

**Files:**
- Modify: `routes/webhook.js`
- Create: `server/services/stripe-webhook.js`
- Create: `tests/server/stripe-webhook.test.js`

- [ ] Write failing tests for missing/invalid signatures.
- [ ] Write failing tests for `checkout.session.completed`, async success/failure, and expiration.
- [ ] Construct events from the raw body and `stripe-signature`.
- [ ] Update purchases idempotently by Stripe session ID.
- [ ] Record payment intent and transition timestamps.
- [ ] Run webhook tests and verify they pass.

### Task 5: Protect Purchased Photos And Gallery Purchases

**Files:**
- Modify: `routes/fotos.js`
- Modify: `routes/galerias.js`
- Create: `tests/server/photo-access.test.js`

- [ ] Write failing tests proving arbitrary `userId` access is rejected.
- [ ] Replace `/compradas/:userId` with authenticated `/purchased`.
- [ ] Filter gallery purchases by paid status and the active access-code/customer scope.
- [ ] Prevent selected paid photos from being selected for checkout again.
- [ ] Run access tests and verify they pass.

### Task 6: Phase Verification

- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd run build`.
- [ ] Run a scan confirming no route outside the webhook service can write `status: "paid"`.
- [ ] Commit the verified phase.
