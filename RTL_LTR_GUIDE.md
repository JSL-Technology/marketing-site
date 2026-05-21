# RTL/LTR Contribution Guide

To maintain a 10/10 internationalization score, follow these guidelines.

## 1. Use Logical Properties
Always prefer logical properties over physical ones.

| Physical | Logical |
|----------|---------|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `border-left` / `border-right` | `border-inline-start` / `border-inline-end` |
| `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| `text-align: left` / `right` | `text-align: start` / `end` |

## 2. Iconography
Directional icons (arrows, chevrons) are automatically mirrored via global CSS in `src/styles.scss`.
- Ensure icons that require mirroring are added to the list in `styles.scss` if they are not already covered.
- Neutral icons (like a 'Settings' gear or 'X' close button) should NOT be mirrored.

## 3. JavaScript/TypeScript Logic
If you use manual translations or positions in TypeScript (e.g., for carousels or custom gestures), inject `DirectionService` and use its `isRtl()` signal.

```typescript
private directionService = inject(DirectionService);

// Example
const multiplier = this.directionService.isRtl() ? -1 : 1;
```

## 4. Testing
- **Audit**: Run `npm run rtl:audit` before committing.
- **E2E**: Add tests in `apps/app/e2e/rtl.spec.ts` for any new direction-sensitive interaction.

## PR Checklist
- [ ] No physical CSS properties used (check with `npm run rtl:audit`).
- [ ] Component tested in both LTR (English) and RTL (Arabic).
- [ ] Directional icons mirror correctly.
- [ ] Mobile gestures (if any) work in both directions.
- [ ] SSR renders with correct `dir` attribute (no hydration flicker).
