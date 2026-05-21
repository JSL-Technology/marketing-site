# CRO Audit Full Fix — Design Spec
**Date:** 2026-05-18  
**Scope:** JSL Technology — Angular 20 SSR + NestJS  
**Baseline score:** 4/10 → Target: 9/10

---

## Problem Statement

The CRO audit identified the conversion machinery as broken at critical points despite strong technical foundations. The highest-priority gaps are:
1. Email leads captured and immediately lost (no ESP integration)
2. No analytics on the most important conversion events (thank-you, quiz, ROI calc)
3. Booking modal points to Calendly homepage instead of a real calendar
4. No feature-flag / A/B testing infrastructure
5. Personalization not driven by UTM source/medium

Social proof toasts remain **intentionally disabled** per user preference.

---

## Architecture

Changes are isolated across three layers with no cross-layer coupling:

```
NestJS API
  contact.dto.ts       — add segment, company, budget fields
  contact.service.ts   — add Brevo HTTP integration (resilient)
  mail.service.ts      — update email template

Angular core
  tokens.ts            — add CALENDLY_URL, FEATURE_FLAGS tokens
  server.ts            — provide tokens from process.env, update CSP
  feature-flag.service.ts  — new lightweight service

Angular features (6 components + 1 service)
  thank-you.ts         — trackConversion + trackEvent on init
  roi-calculator.ts    — trackEvent on result
  digital-maturity-selector.ts — trackEvent per step + completion
  footer.ts            — trackEvent on newsletter success
  home.ts / home.html  — trackEvent on hero CTA click
  whitepaper-download.ts — call newsletter API + analytics
  personalization.service.ts — UTM → segment mapping
  booking-modal.ts     — inject CALENDLY_URL token
```

---

## Section 1: Lead Pipeline (Pilar 6)

### contact.dto.ts
Add optional fields for lead qualification:
- `segment?: string` — personalization segment (startup/enterprise/small-business)
- `company?: string` — company name
- `budget?: string` — budget range

### contact.service.ts
Add private `addBrevoContact(email, attributes)` method:
- `POST https://api.brevo.com/v3/contacts`
- Body: `{ email, attributes: { SOURCE, SEGMENT, SERVICE, COMPANY, BUDGET }, listIds: [listId] }`
- Headers: `{ api-key: BREVO_API_KEY }`
- If `BREVO_API_KEY` not set: log warning and return (never blocks the form submission)
- Called from both `handleNewsletterSubscription()` and `handleContactForm()`

### mail.service.ts
Update `sendContactEmail()` signature to accept `company?`, `budget?`, `segment?` and include them in the HTML template.

---

## Section 2: Analytics Events (Pilar 1)

**6 new trackEvent() calls — zero new dependencies:**

| Component | Event | Params |
|-----------|-------|--------|
| `thank-you.ts` | `contact_form_complete` (conversion) + `generate_lead` | — |
| `roi-calculator.component.ts` | `roi_calculator_result` | `{ weekly, annual }` |
| `digital-maturity-selector.ts` | `quiz_step` | `{ step, value }` |
| `digital-maturity-selector.ts` | `quiz_complete` | `{ size, goal, tech }` |
| `footer.ts` | `newsletter_subscribe` | — |
| `home.html` | `hero_cta_click` | `{ slide: 0 }` |
| `whitepaper-download.ts` | `whitepaper_download` | `{ source: 'whitepaper' }` |

Implementation pattern (consistent with existing code):
- Inject `AnalyticsService` via constructor injection
- Use `effect()` for computed-derived events (ROI, quiz result)
- Use direct calls in click handlers / subscribe callbacks

---

## Section 3: Booking Modal Fix (Pilar 7)

### tokens.ts
```typescript
export const CALENDLY_URL = new InjectionToken<string>('CALENDLY_URL', {
  providedIn: 'root',
  factory: () => '',
});
```

### server.ts
```typescript
const ENV_CALENDLY_URL = process.env['CALENDLY_URL'] ?? '';
// In angularApp.handle() providers:
{ provide: CALENDLY_URL, useValue: ENV_CALENDLY_URL }
```

CSP update: add `https://calendly.com` to `frame-src`, `connect-src`.

### booking-modal.ts
Inject `CALENDLY_URL` token. If the token value is non-empty, use it as the default for `@Input() bookingUrl`.

---

## Section 4: Whitepaper Real Delivery (Pilar 4 + 6)

### whitepaper-download.ts
1. On `onSubmit()`: call `ApiService.subscribeToNewsletter(email)` to save lead
2. Track `analytics.trackEvent('whitepaper_download', { source: 'whitepaper' })`
3. Resolve PDF URL: check `(globalThis as any).__env?.WHITEPAPER_PDF_URL` first, fall back to `@Input() pdfUrl`
4. `window.open(resolvedUrl, '_blank')` — only after API call resolves

### server.ts
Expose `WHITEPAPER_PDF_URL` in the `__env` injection (or as an Angular token — consistent with how `RECAPTCHA_SITE_KEY` is exposed via `__env`).

---

## Section 5: UTM Personalization (Pilar 2)

### personalization.service.ts
In `trackNavigation()`, after the URL segment detection, add UTM detection:
```
utm_source=linkedin, utm_medium=cpc  → enterprise
utm_source=producthunt                → startup
utm_source=twitter/instagram          → small-business
utm_medium=email                      → returning (mark isEmailLead)
```
This runs on every NavigationEnd (already subscribed), so no additional subscription needed.

---

## Section 6: Feature Flag Service (Pilar 3)

### tokens.ts
```typescript
export const FEATURE_FLAGS = new InjectionToken<Record<string, boolean>>('FEATURE_FLAGS', {
  providedIn: 'root',
  factory: () => ({}),
});
```

### server.ts
```typescript
const ENV_FEATURE_FLAGS = JSON.parse(process.env['FEATURE_FLAGS'] ?? '{}');
// In providers:
{ provide: FEATURE_FLAGS, useValue: ENV_FEATURE_FLAGS }
```

### feature-flag.service.ts
```typescript
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  constructor(@Inject(FEATURE_FLAGS) private flags: Record<string, boolean>) {}
  isEnabled(flag: string): boolean { return this.flags[flag] === true; }
}
```

Usage example: `featureFlags.isEnabled('new_hero_copy')` returns true if `FEATURE_FLAGS={"new_hero_copy":true}` is set in the env.

---

## Error Handling

- Brevo API calls: fire-and-forget with try/catch + logger.warn — never block form submission
- Calendly URL missing: BookingModal shows a fallback message instead of broken iframe
- WHITEPAPER_PDF_URL missing: falls back to `@Input() pdfUrl` (existing behavior)
- Feature flags missing: all flags default to `false` (safe default)

---

## Files Changed Summary

| File | Type | Change |
|------|------|--------|
| `apps/api/src/app/contact.dto.ts` | Edit | +3 optional fields |
| `apps/api/src/app/contact.service.ts` | Edit | +Brevo integration |
| `apps/api/src/app/mail.service.ts` | Edit | +new fields in template |
| `apps/app/src/app/core/constants/tokens.ts` | Edit | +2 tokens |
| `apps/app/src/server.ts` | Edit | +env provisions, CSP update |
| `apps/app/src/app/core/services/feature-flag.service.ts` | New | Feature flag service |
| `apps/app/src/app/shared/components/booking-modal/booking-modal.ts` | Edit | +CALENDLY_URL injection |
| `apps/app/src/app/features/thank-you/thank-you.ts` | Edit | +analytics on init |
| `apps/app/src/app/shared/components/roi-calculator/roi-calculator.component.ts` | Edit | +analytics on result |
| `apps/app/src/app/features/home/components/digital-maturity-selector/digital-maturity-selector.ts` | Edit | +analytics per step/result |
| `apps/app/src/app/layout/footer/footer.ts` | Edit | +analytics on subscribe |
| `apps/app/src/app/features/home/home.ts` | Edit | +hero CTA click handler |
| `apps/app/src/app/features/home/home.html` | Edit | +click binding on hero CTA |
| `apps/app/src/app/shared/components/whitepaper-download/whitepaper-download.ts` | Edit | +API call + analytics |
| `apps/app/src/app/core/services/personalization.service.ts` | Edit | +UTM detection |

**Total: 14 file edits + 1 new file. Zero new npm dependencies.**
