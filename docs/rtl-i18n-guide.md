# RTL / i18n Development Guide — JSL Technology

## Quick start

| Command | Purpose |
|---|---|
| `npm run rtl:check-css` | Detect physical CSS direction properties |
| `npm run rtl:check-i18n` | Validate all i18n files match `en.json` keys |
| `npm run rtl:validate` | Run both checks (use in CI) |

---

## Core architecture

### DirectionService

Single source of truth for the active text direction. It reacts to language changes via `ngx-translate` and updates:
- `html[dir]`
- `html[lang]`
- `body[dir]`
- `isRtl` signal (use in templates and TS)

```typescript
// In a component template
<div [attr.dir]="directionService.isRtl() ? 'rtl' : 'ltr'">

// In TypeScript
if (this.directionService.isRtl()) { ... }
```

### RTL language registry (`languages.ts`)

```typescript
// Active RTL locale
export const RTL_LANGUAGES: readonly string[] = ['ar', 'he', 'fa', 'ur'];

// Helper — safe for null/undefined
export function isRtlLanguage(lang: string | null | undefined): boolean
```

To add a new RTL language:
1. Add it to `SUPPORTED_LANGUAGES` in `languages.ts`.
2. If it belongs to an RTL script, it is already recognized — `RTL_LANGUAGES` includes `ar`, `he`, `fa`, `ur`.
3. Add its JSON file to `apps/app/src/assets/i18n/`.
4. Run `npm run rtl:check-i18n` to confirm key parity.

---

## CSS — required practices

### Use logical properties (NOT physical)

| Physical ❌ | Logical ✅ |
|---|---|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `left: 0` (positioning) | `inset-inline-start: 0` |
| `right: 0` (positioning) | `inset-inline-end: 0` |
| `border-top-left-radius` | `border-start-start-radius` |
| `border-top-right-radius` | `border-start-end-radius` |
| `border-bottom-left-radius` | `border-end-start-radius` |
| `border-bottom-right-radius` | `border-end-end-radius` |

**Real examples from this repo:**

```scss
// ✅ blog-detail.scss — blockquote left border
border-inline-start: 4px solid var(--primary);

// ✅ chat-bubble.scss — floating widget position
inset-inline-end: 2rem;

// ✅ toast.scss — container position
inset-inline-end: 24px;
border-inline-start: 4px solid #10b981;

// ✅ timeline.scss — vertical line and marker
inset-inline-start: 20px;
padding-inline-start: 60px;
```

### When a logical property is not possible

Use a `[dir="rtl"]` override and add a comment explaining why:

```scss
// ✅ blog.scss — directional gradient (CSS logical gradients not yet supported)
@media (min-width: 992px) {
  background: linear-gradient(to right, transparent, rgba(0,0,0,0.6));
  [dir="rtl"] & {
    background: linear-gradient(to left, transparent, rgba(0,0,0,0.6));
  }
}
```

To suppress the CI lint for a truly intentional physical property, append `// rtl-ok`:

```scss
.some-element {
  left: 0; // rtl-ok — this is inside a [dir="rtl"] override block
}
```

### CSS gradient direction

CSS gradients (`linear-gradient`, `radial-gradient`) do not currently support logical keywords like `to inline-end`. Use `[dir="rtl"]` selectors for gradients that must mirror:

```scss
// LTR: gradient flows left → right
background: linear-gradient(to right, start-color, end-color);

[dir="rtl"] & {
  // RTL: gradient flows right → left
  background: linear-gradient(to left, start-color, end-color);
}
```

### Icon mirroring

Directional icons are globally mirrored in `styles.scss`:

```scss
[dir="rtl"] {
  lucide-icon[name="ArrowRight"],
  lucide-icon[name="ArrowLeft"],
  lucide-icon[name="ChevronRight"],
  lucide-icon[name="ChevronLeft"] {
    transform: scaleX(-1);
  }
}
```

Do not add `transform: scaleX(-1)` to individual component styles for these icons — the global rule handles them.

---

## Swipe gesture blocker

The app-level swipe blocker (`app.ts`) uses two static helpers to be direction-aware:

```typescript
// Edge detection: left edge in LTR, right edge in RTL
App.detectEdge(clientX, window.innerWidth, threshold, isRtl)

// Gesture check: rightward in LTR, leftward in RTL
App.shouldBlockGesture(dx, dy, minMove, isRtl)
```

These helpers are pure functions with full unit test coverage in `app.spec.ts`.

---

## Swiper / carousel direction

Swiper containers must receive the current direction explicitly:

```html
<!-- home.html example -->
<swiper-container [attr.dir]="directionService.isRtl() ? 'rtl' : 'ltr'">
  ...
</swiper-container>
```

---

## Pre-merge checklist

Before merging any PR that touches CSS or templates:

- [ ] No new `margin-left/right`, `padding-left/right`, `border-left/right`, bare `left:`, bare `right:` introduced (CI: `npm run rtl:check-css`)
- [ ] Any directional gradient has a `[dir="rtl"]` counterpart
- [ ] New i18n keys added to **all** language files, or missing keys are tracked (CI: `npm run rtl:check-i18n`)
- [ ] New components that use `DirectionService.isRtl()` are covered by unit tests
- [ ] Visual check performed in Arabic locale (at least mobile + desktop viewport)
- [ ] `html[dir]`, `html[lang]`, `body[dir]` update correctly when language changes

---

## Anti-patterns

```scss
// ❌ Physical property — breaks RTL
.card { margin-left: 1rem; }

// ✅ Correct
.card { margin-inline-start: 1rem; }

// ❌ Hardcoded left positioning
.badge { left: 12px; }

// ✅ Correct
.badge { inset-inline-start: 12px; }

// ❌ No RTL counterpart for directional gradient
.overlay { background: linear-gradient(to right, ...); }

// ✅ With RTL override
.overlay {
  background: linear-gradient(to right, ...);
  [dir="rtl"] & { background: linear-gradient(to left, ...); }
}
```

---

## Validation commands reference

```bash
# Check for physical CSS direction properties
npm run rtl:check-css

# Check i18n key parity (all langs vs en.json)
npm run rtl:check-i18n

# Run both in sequence (CI gate)
npm run rtl:validate

# Check only a specific folder
node scripts/css/check-physical-css.mjs apps/app/src/app/features/home

# Check i18n with extra-key warnings (STRICT mode)
STRICT=1 node scripts/i18n/check-i18n-parity.mjs
```
