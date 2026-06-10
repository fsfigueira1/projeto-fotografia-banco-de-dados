# Event Gallery Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the current Fauzi Eventos experience into an event-based booking and gallery platform where a client selects a service, picks a date, pays, receives a shareable gallery code, and later accesses a private event gallery; the owner gets a management area for events, uploads, and revenue.

**Architecture:** The app will keep the current Vite + React + Tailwind + TypeScript stack and continue using `src/components/ui` as the shared UI library folder and `src/styles.css` as the global style entry. The domain model centers on `Event` records that connect a service type, date, payment state, access code, and uploaded photos. The public landing page opens service cards and a meeting scheduler, the consumer portal uses an access-code gate to open one event gallery, and the owner portal manages upcoming events, payments, photo uploads, and code publication.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, shadcn-style primitives in `src/components/ui`, Express, MongoDB/Mongoose, Lucide icons, date-fns, WhatsApp deep links.

---

## File Structure

- `src/App.tsx`: landing page orchestration, service cards, scheduler modal, gallery access modal, navigation to owner/client routes.
- `src/components/ui/meeting-scheduler.tsx`: date picker used after a service card is selected.
- `src/components/ui/product-card.tsx`: service card for `casamento`, `formatura`, `aniversario`, `corporativo`, etc.
- `src/components/ui/gallery-access-modal.tsx`: modal that requests the shareable gallery code before opening an event gallery.
- `src/components/ui/payment-methods.tsx`: method selector for `pix`, `cartao`, `boleto`, and `whatsapp`.
- `src/pages/OwnerDashboard.tsx`: owner workspace for upcoming events, payments, uploads, and code management.
- `src/pages/ConsumerPortal.tsx`: customer workspace to browse an event gallery, select photos, and buy.
- `src/pages/EventGallery.tsx`: private gallery page for one event, opened by slug + code.
- `src/lib/api.ts`: typed API wrapper for event, gallery, payment, and upload requests.
- `src/lib/events.ts`: client-side event helpers and normalized types.
- `src/styles.css`: global tokens, shell spacing, and page-level layout utilities.
- `models/Event.js`: Mongo model for events.
- `models/EventPhoto.js`: optional model for photos attached to an event, or reuse `Foto` with `eventId`.
- `routes/eventos.js`: event creation, lookup, code validation, and owner operations.
- `routes/pagamentos.js`: payment method routing and confirmation callbacks.
- `routes/fotos.js`: event-scoped photo listing and owner uploads.

## Data Model

### Event

Fields:
- `serviceType`: `"casamento" | "formatura" | "aniversario" | "corporativo" | string`
- `customerName`
- `customerEmail`
- `eventDate`
- `slug`
- `status`: `"draft" | "pending_payment" | "paid" | "published" | "completed"`
- `paymentStatus`: `"pending" | "paid" | "failed" | "manual_pending"`
- `paymentMethod`: `"pix" | "cartao" | "boleto" | "whatsapp" | null`
- `accessCodeHash`
- `accessCodeLast4`
- `galleryPublished`
- `ownerNotes`
- `whatsappNumber`
- `priceSnapshot`
- `createdAt`, `updatedAt`

### Event photos

Fields:
- `eventId`
- `url`
- `thumbnailUrl`
- `caption`
- `destaque`
- `selectedByCustomer`
- `price`
- `createdAt`

## User Flows

### 1. Service selection and booking

1. The user clicks a product card such as `Casamento`.
2. The `MeetingScheduler` opens and asks for the event date.
3. The booking creates an event in `pending_payment`.
4. The payment method selector appears.
5. After payment confirmation, the system generates the shareable access code and marks the event `paid`.

### 2. Gallery access

1. The `Abrir galeria` button stays in the landing page.
2. Clicking it opens a code-entry modal.
3. The entered code is validated against the event.
4. If the event is not paid, the code is rejected and the modal shows that access is not yet available.
5. If the event is paid, the consumer is taken to the event gallery page.

### 3. Owner workflow

1. The owner opens the dashboard.
2. Upcoming events show dates, service type, payment status, and access status.
3. The owner uploads photos into a selected event.
4. The owner can publish or unpublish the gallery.
5. The owner can copy/regenerate the shareable code and monitor received payments.

### 4. Consumer workflow

1. The consumer enters the code or opens the gallery through a shared link.
2. The private gallery page shows photos for one event only.
3. The consumer selects photos and adds them to checkout.
4. The payment step offers `pix`, `cartao`, `boleto`, or `whatsapp`.
5. After payment, the selected photos are attached to the consumer and the event remains shareable.

## Payment Rules

- `pix`, `cartao`, and `boleto` are first-class choices in the UI.
- `whatsapp` is a manual fallback that opens a prefilled message to the owner with event details and selected photos.
- The access code is only shown after payment is confirmed.
- Code validation must fail closed if the event is not `paid`.
- The backend should expose one payment abstraction so the UI does not care which provider is used.

## Error Handling

- Invalid code: show a short error and keep the modal open.
- Code for unpaid event: show that the gallery is not unlocked yet.
- Missing event/date/payment: block progression and show inline feedback.
- Upload failure: show a retry state in the owner dashboard.
- Payment failure: keep the event in `pending_payment` and allow method retry.

## Testing and Verification

- Verify that selecting a service opens the scheduler.
- Verify that scheduling creates an event and moves the user to payment.
- Verify that the gallery modal rejects unpaid codes.
- Verify that paid events expose the code and open the correct gallery page.
- Verify that the owner dashboard can list events and upload photos.
- Verify that `whatsapp` opens a prefilled message with event context.

## Implementation Notes

- Keep shared primitives in `src/components/ui`.
- Keep global theme tokens in `src/styles.css`.
- Reuse the current `src/lib/utils.ts` `cn()` helper.
- Use the current Vite alias `@` for imports.
- Favor event-scoped data over global photo lists for the consumer experience.
