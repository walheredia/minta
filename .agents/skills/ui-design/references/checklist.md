# UI Visual Checklist

Run against every screenshot in the matrix (390px / 1440px × light / dark). **Hard** items must pass. **Taste** items are judgement calls — fix them unless there is a stated reason not to.

## Hard

- [ ] Geist renders everywhere (no serif/Times fallback anywhere on the page).
- [ ] No horizontal scroll at 390px; nothing clipped or overlapping.
- [ ] Text contrast meets WCAG AA in both themes (muted text included).
- [ ] Every input has a visible label; focus ring visible on keyboard focus.
- [ ] Only semantic tokens used — no hard-coded colors or arbitrary pixel values in the diff.
- [ ] All states exist and were seen: loading, empty, error, success (where the screen has them).
- [ ] Amounts use `formatAmount` + `tabular-nums`; ARS and USD never combined.
- [ ] Copy follows DESIGN.md "Voice & copy": voseo, glossary terms ("Gasto", "Hogar"), no claims about features that don't exist.
- [ ] No machine-writing tells from the DESIGN.md table: slogan colons, trailing "sin X", rule-of-three bullets, stock phrases, em dashes, descriptions that restate the title or list the fields.
- [ ] No console errors or hydration warnings.

## Taste

- [ ] **Hierarchy**: squinting at the screenshot, the most important element (figure, title, primary action) is obvious within one second.
- [ ] **Composition at 1440px**: the layout uses the space intentionally (split, grid, or a centered column with supporting context) — no lone widget floating in a void.
- [ ] **Rhythm**: spacing follows the DESIGN.md scale; related items grouped tight, sections clearly separated. Edges align on a shared grid.
- [ ] **Restraint**: one accent moment; color carries meaning; no decorative filler (icon circles, gratuitous gradients, emoji).
- [ ] **Surfaces**: neutrals tinted, not pure grey/black; depth from surface + hairline, not heavy shadow; no cards nested in cards.
- [ ] **Density**: controls sized per DESIGN.md (`h-10` in forms); rows scannable; nothing cramped or sparse.
- [ ] **Edge content**: long descriptions truncate gracefully; big numbers don't break layout.
- [ ] **Theme parity**: dark mode looks designed, not inverted — same hierarchy, comparable contrast.
- [ ] **Polish**: hover/active/disabled states present; transitions subtle; icons consistent size and stroke.
