# Floating Navbar Design Spec

**Date:** 2026-04-28
**Status:** Approved

## Summary

Convert the current full-width fixed navbar into a floating rounded-island that is always visible at the top of the page, with a GSAP slide-in entrance animation on load.

---

## Visual Design

**Shape:** Rounded rectangle — `border-radius: 16px`. Not a full pill; wide enough to hold the full logo text and all links comfortably.

**Position:** Fixed. 16px gap from the top edge. Horizontal inset of 16px on mobile, 24px on md, 32px on lg+. Centered via `left-0 right-0 mx-auto max-w-5xl` (1024px cap) so it doesn't grow too wide on ultra-wide screens.

**Background:** Always-on frosted glass — `rgba(27, 28, 28, 0.85)` with `backdrop-filter: blur(24px)`. No transparent initial state. The `nav-scrolled` JS class and its CSS rule are removed entirely.

**Border:** `1px solid rgba(163, 209, 181, 0.13)` — subtle primary tint.

**Shadow:** `0 8px 32px rgba(0,0,0,0.45)` — gives the floating lift.

**Inset highlight:** `0 1px 0 rgba(163, 209, 181, 0.07) inset` — thin top edge shimmer.

---

## Layout — Desktop

```
[  JITHU J GEORGE ]  [ Work  About  Experience  Skills  Education ]  [ Let's Connect ]
```

- Logo: left-aligned inside the island
- Nav links: center/right cluster
- CTA button: rightmost, existing green pill style retained

Padding inside the island: `12px 24px`.

---

## Layout — Mobile

The island shrinks to show only logo + hamburger. The mobile dropdown renders as a **separate rounded panel** (`border-radius: 12px`) that appears directly below the island with an 8px gap. It has the same glass background and border treatment as the island.

The existing `mobile-menu-hidden` toggle logic stays intact — only the visual container changes.

---

## Entrance Animation (GSAP)

Added to `animations.js`, fires after the GSAP context is ready:

- **Initial state:** `y: -80, opacity: 0`
- **Animate to:** `y: 0, opacity: 1`
- **Duration:** `0.7s`
- **Ease:** `power3.out`
- **Delay:** `0.3s` — lets the page settle before the bar drops in

The navbar starts hidden via inline style (`opacity: 0; transform: translateY(-80px)`) so there's no flash of the old full-width state.

---

## Changes Required

### `index.html`

1. `<nav>` element: replace `top-0 w-full` positioning classes with inset/margin classes that create the floating island gap.
2. Remove the outer `max-w-7xl mx-auto px-6 md:px-8` wrapper div — the island itself becomes the bounded container.
3. Apply glass background, border, shadow, and `rounded-2xl` directly to the inner bar div.
4. Mobile menu: remove the `border-t` top separator; give the dropdown its own `rounded-xl` container with matching glass styling.

### `style.css`

1. Remove the `#navbar.nav-scrolled` rule — no longer needed.
2. Replace the base `#navbar` rule: remove `background: transparent` and its transition properties; set `opacity: 0` and `transform: translateY(-80px)` as the GSAP starting state (prevents flash before deferred `animations.js` loads).
3. Update `section[id] { scroll-margin-top }` from `80px` to `100px` to account for the taller effective nav height (island + gap).

### `animations.js` (or inline `<script>`)

1. Add a GSAP `from` tween targeting `#navbar` with the entrance params above.
2. Remove the `window.scroll` listener that adds/removes `nav-scrolled`.

---

## What Does Not Change

- All nav link `href` anchors
- Logo text and `href="#hero"`
- "Let's Connect" CTA email link
- Mobile hamburger toggle logic (open/close, icon swap)
- Scroll indicator behaviour
- All other sections and animations
