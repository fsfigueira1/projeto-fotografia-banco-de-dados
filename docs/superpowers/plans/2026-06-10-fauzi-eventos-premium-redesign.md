# Fauzi Eventos Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Fauzi Eventos landing into a premium, editorial, cinematic experience while preserving gallery access, login, private cart, and checkout flows.

**Architecture:** Keep the current React/Vite app and preserve the backend contracts. Reshape the home page into a single premium marketing surface with a strong hero, visual sections, and a more restrained admin entry point. Move the visual language into reusable motion patterns and global background layers so the site feels cohesive without duplicating styling.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion, Lucide React

---

### Task 1: Rebuild the landing page composition

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Identify the hero, CTA, service, and gallery preview blocks that currently define the home page.**

- [ ] **Step 2: Replace the current home layout with a premium editorial composition.**

```tsx
// New home structure to implement inside src/App.tsx:
// 1. full-screen hero with title, subtitle, and two CTAs
// 2. visual proof section with large photography-led composition
// 3. "Como funciona" section with elegant numbered steps
// 4. service showcase with animated premium cards
// 5. gallery/private access CTA repeated near the end
```

- [ ] **Step 3: Wire the existing actions into the new layout.**

```tsx
// Preserve these interactions:
// - openGalleryAccess()
// - openAuthModal("login")
// - openServicePurchase(service)
// - openAdminPage()
```

- [ ] **Step 4: Run the build and confirm the home still renders the existing flows.**

Run: `npm.cmd run build`
Expected: production build completes successfully.

- [ ] **Step 5: Commit the landing restructure.**

```bash
git add src/App.tsx
git commit -m "feat: redesign fauzi eventos landing"
```

### Task 2: Upgrade the global visual system

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace the current flat dark background with layered premium depth.**

```css
/* Add:
   - radial gradients
   - grid overlay
   - subtle noise/scanline effect
   - reduced-motion fallback
*/
```

- [ ] **Step 2: Add premium animation primitives for float, grid drift, and soft reveal.**

```css
@keyframes float-slow { ... }
@keyframes grid-drift { ... }
```

- [ ] **Step 3: Add reusable utility classes for glass surfaces, glow, and premium cards.**

```css
/* Examples:
   .premium-card
   .premium-glow
   .noise-overlay
   .magnetic
*/
```

- [ ] **Step 4: Run the build and confirm CSS compiles cleanly.**

Run: `npm.cmd run build`
Expected: CSS bundle builds without errors.

- [ ] **Step 5: Commit the visual system update.**

```bash
git add src/styles.css
git commit -m "feat: add premium visual system"
```

### Task 3: Polish reusable motion surfaces

**Files:**
- Modify: `src/components/ui/stack-card.tsx`
- Modify: `src/components/ui/scroll-expansion-hero.tsx`

- [ ] **Step 1: Tune the stack cards so they read like luxury product tiles rather than generic cards.**

```tsx
// Use:
// - softer borders
// - refined overlays
// - tighter typography
// - subtle hover and tilt
```

- [ ] **Step 2: Tune the scroll-expansion hero for slower, cleaner cinematic movement.**

```tsx
// Use:
// - softer blur/fade entrance
// - restrained parallax
// - less aggressive scaling
// - premium image overlays
```

- [ ] **Step 3: Keep all current CTA callbacks and access flows intact.**

```tsx
// Do not change:
// - openGalleryAccess
// - openServicePurchase
// - admin access entry points
```

- [ ] **Step 4: Run the build to catch any motion or JSX regressions.**

Run: `npm.cmd run build`
Expected: build succeeds and the homepage remains interactive.

- [ ] **Step 5: Commit the motion polish.**

```bash
git add src/components/ui/stack-card.tsx src/components/ui/scroll-expansion-hero.tsx
git commit -m "feat: refine premium motion surfaces"
```

### Task 4: Verify access, checkout, and admin entry points

**Files:**
- Modify if needed: `src/App.tsx`
- Inspect: `src/components/AuthModal.tsx`
- Inspect: `routes/auth.js`

- [ ] **Step 1: Confirm the gallery code modal still opens from the new CTA hierarchy.**

```tsx
// Verify:
// - "Acessar galeria" opens the password modal
// - invalid code shows an error
// - valid code opens private gallery session
```

- [ ] **Step 2: Confirm the owner login still opens the admin page.**

```tsx
// Verify:
// - authenticated administrators receive role admin from the backend
// - admin page opens after success
// - no public user sees admin controls
```

- [ ] **Step 3: Confirm service checkout and WhatsApp purchase remain reachable.**

```tsx
// Verify:
// - openServicePurchase(service) still works
// - payment methods remain visible
// - WhatsApp checkout CTA still opens the correct flow
```

- [ ] **Step 4: Run the build one final time.**

Run: `npm.cmd run build`
Expected: final production build passes.

- [ ] **Step 5: Commit the verification-safe cleanup.**

```bash
git add src/App.tsx src/components/AuthModal.tsx routes/auth.js
git commit -m "fix: keep access flows intact during redesign"
```
