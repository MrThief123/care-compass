# Progress — F0-05 Design tokens, typography and base styles

Status: NOT STARTED
Owner: unclaimed
Lane: S — Shared kit
Sprint: SPRINT · planned D1
Branch: `feature/shared-design-tokens` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work

## Dependencies status
- F0-02 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Colour tokens (exact hex from Figma variables): bg/canvas #E9F8FA, bg/surface #FEFEFE, bg/inset #E9F8FA, bg/brand #0C9BA9, bg/brand-deep #07727D, bg/brand-light #49B7BF, bg/brand-pale #C6EAEF, bg/muted #8DB8C8, bg/accent #E69A81, bg/alert #FDF1EC, bg/alert-badge #F7C4B4, bg/alert-strong #B5543A, text/primary #1F282D, text/secondary #696E6A, text/muted #8DB8C8, text/brand #07727D, text/alert #B5543A, text/alert-strong #8A3A24, text/on-dark #FEFEFE, border/subtle #E9F8FA, border/default #D7F2F4, border/brand #07727D, border/alert #E8A98F.
- Type ramp utilities from Figma text styles: Title/Page 20/26 500, Title/Section 16/22 500, Title/Card 15/20 500, Metric/Large 22/28 500, Metric/Medium 18/24 500, Body/Emphasis 14/20 500, Body/Default 14/20 400, Body/Small 13/18 400, Body/Secondary 12/16 400, Label/Caps 11/14 400 uppercase 0.06em.
- IBM Plex Sans via `next/font`; `tabular-nums` utility applied to times, currency, percentages and counts.
- Spacing scale space/1–9 = 4, 8, 12, 16, 20, 24, 32, 40, 48 px.
- Radius tokens: pill 6, control 8, card 10, inset 8, full 9999 (numeric values from UI Spec §5.3 because Figma radius variables did not expose values — confirm in F0-01).
- Rail gradient style: vertical #07727D → #0C9BA9.
- Global visible focus ring on all interactive elements; body text min 13px.
- shadcn/ui initialised with its CSS variables mapped to the tokens above.
- Contrast test over an approved foreground/background pair list.

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/styles/tokens.css`, `src/app/globals.css`, `src/app/layout.tsx`, `src/styles/tokens.fixture.json`, `src/styles/contrast.test.ts`, `components.json`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE F0-05, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
