# Floating Navbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the full-width fixed navbar into a floating rounded-island that is always visible with a GSAP slide-in entrance on load.

**Architecture:** Three files change — `style.css` strips the scroll-glass rule and seeds the initial hidden state, `index.html` restructures the nav into a floating island with a separate mobile dropdown panel, and `animations.js` adds the entrance tween and updates the smooth-scroll offset.

**Tech Stack:** Vanilla HTML/CSS, Tailwind CDN, GSAP 3.12 (already loaded)

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `style.css` | Modify | Remove `#navbar.nav-scrolled` rule; replace `#navbar` base rule; update `scroll-margin-top` |
| `index.html` | Modify | Restructure `<nav>` into floating island; replace mobile dropdown container; remove scroll listener |
| `animations.js` | Modify | Add navbar entrance tween in `initGSAP()`; update smooth-scroll offset from 80 → 100 |

---

## Task 1: Update `style.css` — strip scroll-glass, seed initial state

**Files:**
- Modify: `style.css:40-51` (nav glass rules), `style.css:214` (scroll-margin-top)

- [ ] **Step 1: Replace the `#navbar` base rule and remove `nav-scrolled`**

In `style.css`, find this block (lines 40–51):

```css
/* ── Glassmorphism nav (state toggled by JS) ─────────────────── */
#navbar {
  background: transparent;
  transition: background 0.4s ease, backdrop-filter 0.4s ease,
              box-shadow 0.4s ease;
}
#navbar.nav-scrolled {
  background: rgba(19, 19, 19, 0.72);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 8px 32px rgba(229, 226, 225, 0.04);
}
```

Replace it with:

```css
/* ── Floating island nav — GSAP animates in from y:-80 ───────── */
#navbar {
  opacity: 0;
}
```

- [ ] **Step 2: Update `scroll-margin-top`**

Find (line ~214):

```css
section[id] { scroll-margin-top: 80px; }
```

Replace with:

```css
section[id] { scroll-margin-top: 100px; }
```

- [ ] **Step 3: Verify in browser**

Open `index.html` in a browser. The navbar should be invisible on load (opacity 0). No other layout should change. No console errors.

---

## Task 2: Restructure nav markup in `index.html`

**Files:**
- Modify: `index.html:83-130` (nav element), `index.html:853-861` (scroll listener)

- [ ] **Step 1: Replace the entire `<nav>` block**

Find this block (lines 83–130):

```html
  <!-- ═══════════════════════ TOP NAV ═══════════════════════ -->
  <nav id="navbar" class="fixed top-0 w-full z-50 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-6 md:px-8">
      <div class="flex items-center justify-between py-5 md:py-6">

        <!-- Logo -->
        <a href="#hero" class="font-headline text-lg md:text-xl font-bold tracking-tighter text-on-background hover:text-primary transition-colors duration-300">
          JITHU J GEORGE
        </a>

        <!-- Desktop Links -->
        <div class="hidden md:flex items-center gap-8 lg:gap-10 font-headline text-sm tracking-tight">
          <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#work">Work</a>
          <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#expertise">About</a>
          <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#experience">Experience</a>
          <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#systems">Skills</a>
          <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#education">Education</a>
        </div>

        <!-- CTA + Hamburger -->
        <div class="flex items-center gap-3">
          <a href="mailto:jithu10052001@gmail.com"
             class="hidden md:inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg font-headline font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(163,209,181,0.25)]">
            Let's Connect
          </a>
          <button id="mobile-menu-btn" aria-label="Toggle menu"
                  class="md:hidden flex items-center justify-center w-10 h-10 text-on-background rounded-lg hover:bg-surface-container-low transition-colors">
            <span class="material-symbols-outlined" id="menu-icon">menu</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div id="mobile-menu"
         class="mobile-menu-hidden md:hidden bg-surface-container-low/95 backdrop-blur-xl border-t border-outline-variant/10">
      <div class="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-1 font-headline">
        <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#work">Work</a>
        <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#expertise">About</a>
        <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#experience">Experience</a>
        <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#systems">Skills</a>
        <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#education">Education</a>
        <a href="mailto:jithu10052001@gmail.com"
           class="mt-3 bg-primary text-on-primary px-5 py-3 rounded-lg font-semibold text-sm text-center transition-all duration-300 hover:shadow-[0_8px_24px_rgba(163,209,181,0.2)]">
          Let's Connect
        </a>
      </div>
    </div>
  </nav>
```

Replace with:

```html
  <!-- ═══════════════════════ TOP NAV ═══════════════════════ -->
  <nav id="navbar" class="fixed top-4 inset-x-4 md:inset-x-6 z-50">

    <!-- Island bar -->
    <div class="flex items-center justify-between px-5 md:px-6 py-3 rounded-2xl
                bg-surface-container-low/85 backdrop-blur-2xl
                border border-primary/[0.13]
                shadow-[0_8px_32px_rgba(0,0,0,0.45),0_1px_0_rgba(163,209,181,0.07)_inset]">

      <!-- Logo -->
      <a href="#hero" class="font-headline text-lg md:text-xl font-bold tracking-tighter text-on-background hover:text-primary transition-colors duration-300">
        JITHU J GEORGE
      </a>

      <!-- Desktop Links -->
      <div class="hidden md:flex items-center gap-8 lg:gap-10 font-headline text-sm tracking-tight">
        <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#work">Work</a>
        <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#expertise">About</a>
        <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#experience">Experience</a>
        <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#systems">Skills</a>
        <a class="nav-link text-secondary hover:text-on-background transition-all duration-300 hover:-translate-y-0.5" href="#education">Education</a>
      </div>

      <!-- CTA + Hamburger -->
      <div class="flex items-center gap-3">
        <a href="mailto:jithu10052001@gmail.com"
           class="hidden md:inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg font-headline font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(163,209,181,0.25)]">
          Let's Connect
        </a>
        <button id="mobile-menu-btn" aria-label="Toggle menu"
                class="md:hidden flex items-center justify-center w-10 h-10 text-on-background rounded-lg hover:bg-white/5 transition-colors">
          <span class="material-symbols-outlined" id="menu-icon">menu</span>
        </button>
      </div>
    </div>

    <!-- Mobile Menu — separate panel below island -->
    <div id="mobile-menu" class="mobile-menu-hidden md:hidden mt-2">
      <div class="bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/15 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
        <div class="px-3 py-3 flex flex-col gap-1 font-headline">
          <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#work">Work</a>
          <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#expertise">About</a>
          <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#experience">Experience</a>
          <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#systems">Skills</a>
          <a class="mobile-nav-link py-3 px-4 rounded-lg text-secondary hover:text-on-background hover:bg-surface-container transition-colors" href="#education">Education</a>
          <a href="mailto:jithu10052001@gmail.com"
             class="mt-2 bg-primary text-on-primary px-5 py-3 rounded-lg font-semibold text-sm text-center transition-all duration-300 hover:shadow-[0_8px_24px_rgba(163,209,181,0.2)]">
            Let's Connect
          </a>
        </div>
      </div>
    </div>
  </nav>
```

- [ ] **Step 2: Remove the scroll listener for `nav-scrolled`**

In the inline `<script>` block near line 853, find and delete this section entirely (including the comment):

```js
    /* ── Glassmorphism Nav on Scroll ── */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('nav-scrolled');
      } else {
        navbar.classList.remove('nav-scrolled');
      }
    }, { passive: true });
```

- [ ] **Step 3: Verify layout in browser**

Open `index.html`. The navbar should still be invisible (Task 1 sets opacity: 0). Inspect the element — confirm it has `top: 16px`, `inset-x-4`, and `rounded-2xl` on the inner div. The mobile menu toggle button should still be present. No console errors.

---

## Task 3: Add navbar entrance animation in `animations.js`

**Files:**
- Modify: `animations.js:183-210` (`initGSAP` function), `animations.js:191` (smooth scroll offset)

- [ ] **Step 1: Add the navbar entrance tween and fix the smooth-scroll offset**

In `animations.js`, find `initGSAP()` (line 183). Replace the entire function with:

```js
  function initGSAP() {
    document.querySelectorAll('a[href^="#"]').forEach(function(link){
      link.addEventListener('click',function(e){
        var href=link.getAttribute('href');
        if(!href||href==='#') return;
        var t=document.querySelector(href);
        if(!t) return;
        e.preventDefault();
        window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY-100, behavior:'smooth'});
      });
    });

    if(typeof gsap==='undefined'||typeof ScrollTrigger==='undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    /* ── Floating navbar entrance ── */
    gsap.set('#navbar', { y: -80 });
    gsap.to('#navbar', { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.3 });

    var hc = document.querySelector('#hero .max-w-7xl');
    if(hc) gsap.to(hc,{y:IS_MOBILE?-48:-88,ease:'none',
      scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:1.4}});

    document.querySelectorAll('.hero-glow').forEach(function(g,idx){
      gsap.to(g,{y:idx===0?-70:90,ease:'none',
        scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:2.2}});
    });

    var si=document.querySelector('.scroll-indicator');
    if(si) gsap.to(si,{opacity:0,y:-20,ease:'none',
      scrollTrigger:{trigger:'#hero',start:'top top',end:'15% top',scrub:true}});
  }
```

Key changes from the original:
- Line `window.scrollY-80` → `window.scrollY-100` (accounts for floating island height + gap)
- Added `gsap.set('#navbar', { y: -80 })` — moves to the "from" position before the tween starts
- Added `gsap.to('#navbar', { y: 0, opacity: 1, ... })` — the entrance animation

- [ ] **Step 2: Verify the full experience in browser**

Open `index.html`. On load:
1. Navbar is invisible for ~0.3 s
2. Navbar slides down from above and fades in over 0.7 s
3. The island floats with a 16px gap from the top and from each side
4. Clicking any nav link (e.g. "Work") scrolls to the correct section without the heading being obscured by the island
5. On mobile: hamburger opens the dropdown panel below the island; links close it
6. No console errors

---

## Self-Review

**Spec coverage:**
- ✅ Rounded rectangle island (border-radius: 16px / `rounded-2xl`)
- ✅ Fixed, 16px top gap (`top-4`), 16px/24px horizontal inset (`inset-x-4 md:inset-x-6`)
- ✅ Always-on glass background (`bg-surface-container-low/85 backdrop-blur-2xl`)
- ✅ Border: `border-primary/[0.13]`
- ✅ Shadow + inset highlight via `shadow-[...]`
- ✅ `nav-scrolled` rule removed from CSS
- ✅ Scroll listener removed from JS
- ✅ GSAP entrance: `y: -80 → 0`, `opacity: 0 → 1`, 0.7s, power3.out, 0.3s delay
- ✅ `scroll-margin-top` updated to 100px
- ✅ Smooth scroll offset updated to 100
- ✅ Mobile dropdown as separate rounded panel below island
- ✅ All links, anchors, toggle logic unchanged
