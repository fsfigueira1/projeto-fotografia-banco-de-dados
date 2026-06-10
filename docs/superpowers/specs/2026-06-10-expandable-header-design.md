# Expandable Header Design

## Objective

Replace the current Fauzi Eventos header with an expandable-tabs navigation while preserving every existing navigation and authentication behavior. The rest of the site, including Lenis and GSAP scrolling, remains unchanged.

## Existing Project Fit

The project already uses React, TypeScript, Tailwind CSS, the `@/*` alias, and the default shadcn-style UI directory at `src/components/ui`. The required packages `framer-motion`, `lucide-react`, and `usehooks-ts` are already installed. No provider or image asset is required for this component.

## Desktop Header

The header remains sticky and uses a dark translucent glass surface consistent with the current premium design.

- The Fauzi Eventos brand remains on the left and returns to the home page.
- `ExpandableTabs` appears on the right.
- Tabs represent gallery access, login or the signed-in profile, optional admin access, and logout when authenticated.
- Selecting a tab immediately invokes its existing action.
- Only one tab label expands at a time.
- The active tab is visual feedback only; modal and page state remain owned by `App`.

## Mobile Header

Below the desktop breakpoint, the expandable tabs are replaced by the existing menu-button pattern.

- The brand remains visible.
- The menu opens as a vertical glass panel with full labels and large touch targets.
- Gallery access and login are always available when applicable.
- Admin access appears only for the authenticated administrator.
- Profile identity and logout appear when authenticated.
- Triggering an action closes the menu.

## Component Contract

`ExpandableTabs` will accept action-bearing tab items instead of requiring `App` to map selected numeric indexes back to actions. Separators remain non-interactive.

Each actionable tab contains:

- a stable identifier,
- a title,
- a Lucide icon,
- an optional click callback,
- an optional accessible label.

The component keeps its own expanded visual state. Clicking outside collapses the active label and reports `null` through `onChange`.

## Behavior Preservation

The implementation must preserve:

- brand click returning to `home`,
- gallery password modal opening,
- login modal opening,
- authenticated user name display,
- admin navigation for the administrator only,
- logout clearing stored user data and returning to `home`,
- all existing modal, gallery, checkout, and scrolling behavior.

## Accessibility And Motion

- Every button uses `type="button"`.
- Icon-only states retain accessible labels.
- Separators are hidden from assistive technology.
- Focus-visible styles remain clear against the dark surface.
- Existing reduced-motion CSS continues to disable nonessential animation.

## Testing And Verification

Add focused component tests for:

- invoking a tab action,
- expanding the selected label,
- collapsing on outside click,
- rendering separators as non-interactive elements.

Run the focused tests and `npm.cmd run build`. The final diff must not modify the existing unrelated `public/index.html` working-tree change.
