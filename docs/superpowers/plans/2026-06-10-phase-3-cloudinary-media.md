# Phase 3 Cloudinary Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store production photos in Cloudinary, validate uploads, and deliver watermarked previews separately from purchased downloads.

**Architecture:** Add a provider-neutral media service with Cloudinary and local-development implementations. Upload routes use memory buffers and delegate persistence to the service; media routes authorize gallery previews and authenticated paid downloads before returning provider URLs or local files.

**Tech Stack:** Cloudinary Node SDK, Multer, Express, Mongoose, Vitest, Supertest

---

### Task 1: Install Cloudinary And Test Media Service

- [ ] Install `cloudinary`.
- [ ] Write failing tests for Cloudinary upload options, watermarked preview URLs, and signed download URLs.
- [ ] Implement `server/services/media.js`.
- [ ] Support local storage only when `MEDIA_STORAGE=local`.
- [ ] Verify media service tests pass.

### Task 2: Rewrite Upload Route

- [ ] Write failing tests for authentication, MIME allowlist, size limit, gallery validation, and persisted provider metadata.
- [ ] Replace direct disk-only Multer configuration with memory upload and media-service delegation.
- [ ] Return the standard response envelope.
- [ ] Stop maintaining duplicated gallery `photoIds`.
- [ ] Verify upload tests pass.

### Task 3: Protect Preview And Download Routes

- [ ] Write failing tests for gallery-scoped previews.
- [ ] Write failing tests proving download requires an authenticated paid purchase.
- [ ] Resolve photos by database ID instead of arbitrary source URLs.
- [ ] Redirect Cloudinary requests to generated signed URLs.
- [ ] Stream local development files only after equivalent authorization.
- [ ] Verify media access tests pass.

### Task 4: Integrate Gallery Serialization

- [ ] Return protected preview endpoints or signed previews for private photos.
- [ ] Mark purchased photos and provide download endpoints only for paid ownership.
- [ ] Keep public marketing images independent from private media.
- [ ] Verify gallery tests and frontend typecheck.

### Task 5: Migration And Verification

- [ ] Update seed data for ObjectId references and provider metadata.
- [ ] Add a legacy-data migration script without destructive deletes.
- [ ] Run tests, typecheck, build, router load, and secret scan.
- [ ] Commit the verified phase.
