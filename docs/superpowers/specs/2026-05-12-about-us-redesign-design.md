# About Us Page Redesign — Design Spec
**Date:** 2026-05-12  
**Status:** Approved  
**Component:** `apps/app/src/app/features/about-us/`

---

## 1. Overview

Complete visual redesign of the About Us page. The goal is a premium, modern SaaS aesthetic that transmits technical credibility, trust, and brand identity — inspired by Linear, Stripe, Vercel, and Apple.

**Chosen direction:** Technical Elegance (C) + Centered Statement hero (A).

No logic changes. All i18n keys, routing, data service calls, and Angular component structure are preserved. Only `about-us.html` and `about-us.scss` change substantially; `about-us.ts` receives minor additions (font loading, no logic changes).

---

## 2. Design Tokens (existing, no changes)

| Token | Value |
|-------|-------|
| `--bg-primary` | `#0d0d0d` |
| `--bg-secondary` | `#1a1a1a` |
| `--primary` | `#ff4b2b` |
| `--secondary` | `#ff416c` |
| `--text-main` | `#f5f5f5` |
| `--text-muted` | `#a0a0a0` |
| `--border-color` | `rgba(255,255,255,0.08)` |

The background in the redesign uses `#0a0a0f` (slightly deeper than `--bg-primary`) as a page-level override for more contrast against the glass cards. All other tokens stay unchanged.

---

## 3. Typography

Add two Google Fonts to `index.html` (or `styles.scss` `@import`):

- **Syne** (weights 600, 700, 800) — used for all headings (`h1`–`h3`, stat numbers, section titles)
- **Inter** (weights 400, 500, 600) — used for body text, labels, captions

All other pages keep their existing font stack. The `font-family` overrides are scoped to `.about-page` (a class added to the host element via `host: { class: 'about-page' }`).

---

## 4. Sections & Layout

### 4.1 Hero
- **Layout:** Full-width centered column
- **Background:** Subtle grid texture via `background-image: repeating-linear-gradient` at `rgba(255,75,43,0.04)`, 32px cells
- **Ambient glow:** Single radial gradient centered behind the heading (`rgba(255,75,43,0.13)`, 500px wide, `position:absolute`)
- **Badge pill:** `ABOUT.INTRO_EYEBROW` key (already exists in i18n) · orange dot · pill border · uppercase spaced label
- **Heading:** `ABOUT.TITLE` — large (clamp 32px→52px), weight 800, Syne, letter-spacing -1px. Second line wrapped in `<em>` with `background: gradient; -webkit-background-clip: text` for gradient color accent
- **Subtitle:** `ABOUT.SUBTITLE` — 15px Inter, muted color, max-width 480px, centered
- **Animation:** `animateOnScroll` directive on the hero container (fade-up)

### 4.2 Stats Band
- **Layout:** 4-column CSS grid, `border-top` separator from hero
- Each stat: number (`ABOUT.STAT_*_VAL`) in gradient text (Syne 800), label (`ABOUT.STAT_*`) in muted uppercase spaced text
- Columns separated by `border-right: 1px solid var(--border-color)`; last column has no border
- No card backgrounds — the band is flat with only borders for separation
- **Animation:** `animateOnScroll` with stagger via `animation-delay` on each stat item (0, 80, 160, 240ms)

### 4.3 Intro Section
- **Layout:** 2-column CSS grid (`1fr 1fr`), gap 0, `border-top`
- **Left column:** eyebrow label · title (`ABOUT.INTRO_TITLE`) · two body paragraphs (`ABOUT.INTRO_DESC_1`, `ABOUT.INTRO_DESC_2`) · CTA button linking to `/contact`
- **Right column:** Unsplash image (`600×400`, `object-fit: cover`) with a subtle gradient overlay at bottom; `border-left: 1px solid var(--border-color)`
- **Gradient divider:** `1px` tall `linear-gradient(90deg, rgba(255,75,43,0.4), rgba(255,75,43,0.05), transparent)` after the section, `margin: 0 32px`
- **Mobile:** stacks to single column; image moves below text, full-width, fixed height 220px
- **Animation:** `animateOnScroll` on left column (slide-right), right column (slide-left)

### 4.4 Core Values (Mission · Vision · Values)
- **Layout:** Centered section with eyebrow + title header, then `3-column` CSS grid of glass cards
- **Card:** `background: rgba(255,255,255,0.025)` · `border: 1px solid rgba(255,255,255,0.07)` · `border-radius: 10px` · `backdrop-filter: blur(8px)`
- **Card icon:** 32px square, `border-radius: 8px`, gradient background, Lucide icon (white, 16px)
- **Card hover:** `border-color` transitions to `rgba(255,75,43,0.3)`, subtle `translateY(-3px)`, `box-shadow` appears
- **Mobile:** single column
- **Animation:** `animateOnScroll` on each card, staggered 100ms apart

### 4.5 Awards
- **Layout:** Left-aligned eyebrow label + 3-column flex row of award cards
- **Award card:** icon square (gradient background) + text stack (award name bold, sub-label muted)
- **Card style:** same glass treatment as values cards but more compact (no hover lift needed)
- **Mobile:** wraps to `grid-template-columns: 1fr 1fr` then single column at <480px

### 4.6 Team
- **Layout:** Centered eyebrow + title + `4-column` auto-fit grid (`minmax(200px, 1fr)`)
- **Team card:** image top (`object-fit: cover`, height 160px, `border-radius: 10px 10px 0 0`) + gradient overlay at bottom of image + info block below
- **Info block:** name (Syne 600), role (muted, small), cert tags (pill tags, primary-tinted border)
- **Card hover:** image saturates (removes `filter: grayscale(0.4)`), card border lightens
- **"Join Our Team" CTA:** ghost button, full-width on mobile
- **Mobile:** 2-column grid → 1-column at <480px
- **Animation:** `animateOnScroll` on the grid container

### 4.7 CTA Component
- Existing `<app-cta>` component, no changes
- Preceding it: a `1px` border-top with `rgba(255,75,43,0.1)` tint, and a top-glow radial gradient as a visual separator

---

## 5. Animations

All animations use the existing `animateOnScroll` directive which adds `is-visible` on intersection.

```scss
// Base state
[animateOnScroll] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
[animateOnScroll].is-visible {
  opacity: 1;
  transform: none;
}
```

Stagger is implemented with inline `style="animation-delay: Xms"` on child items (stats, value cards, team cards).

Card hover transitions use `transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s`.

---

## 6. Responsive Breakpoints

| Breakpoint | Change |
|------------|--------|
| `< 992px` | Stats band → 2×2 grid; intro → single column; values → single column; team → 2-column |
| `< 768px` | Hero padding reduced; stats → 2×2; awards → 2-col; team → 1-col |
| `< 480px` | Hero font clamp floor kicks in; all grids → 1-col; intro image fixed 220px height |

No horizontal overflow at any breakpoint. All padding scales with `clamp()` or responsive variables.

---

## 7. Files Changed

| File | Change |
|------|--------|
| `about-us.html` | Full rewrite of template markup |
| `about-us.scss` | Full rewrite of component styles |
| `about-us.ts` | Add `host: { class: 'about-page' }` for font scoping |
| `index.html` | Add Google Fonts preconnect + Syne/Inter stylesheet link |
| `styles.scss` | Add `.about-page` font-family override (scoped, no global impact) |

No changes to routing, data service, i18n keys, or any other component.

---

## 8. Out of Scope

- No changes to the `CtaComponent` internals
- No new i18n keys (all existing `ABOUT.*` keys reused)
- No changes to `AnimateOnScroll` directive
- No changes to mock data or data service
- No SEO/meta changes
