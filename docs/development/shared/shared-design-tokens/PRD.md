# F0-05 — Design tokens, typography and base styles

| Field | Value |
|---|---|
| Feature ID | F0-05 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-design-tokens` |
| Documentation | `docs/development/shared/shared-design-tokens/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D1 |
| Status / owner | See PROGRESS.md |

## Purpose
Encode the design system once, centrally.

## Problem
Hard-coded colours drift and break WCAG AA; Prototype A failed on colour contrast.

## Description
Implements the Care Compass visual foundation exactly as defined in Figma '01 · Foundations' and the UI Spec §5, including contrast rules.

## User value
Every screen shares one accessible visual system; contrast rules are enforced by tests rather than memory.

## Users
- All users (indirectly)
- Developers

## Scope
- Colour tokens (exact hex from Figma variables): bg/canvas #E9F8FA, bg/surface #FEFEFE, bg/inset #E9F8FA, bg/brand #0C9BA9, bg/brand-deep #07727D, bg/brand-light #49B7BF, bg/brand-pale #C6EAEF, bg/muted #8DB8C8, bg/accent #E69A81, bg/alert #FDF1EC, bg/alert-badge #F7C4B4, bg/alert-strong #B5543A, text/primary #1F282D, text/secondary #696E6A, text/muted #8DB8C8, text/brand #07727D, text/alert #B5543A, text/alert-strong #8A3A24, text/on-dark #FEFEFE, border/subtle #E9F8FA, border/default #D7F2F4, border/brand #07727D, border/alert #E8A98F.
- Type ramp utilities from Figma text styles: Title/Page 20/26 500, Title/Section 16/22 500, Title/Card 15/20 500, Metric/Large 22/28 500, Metric/Medium 18/24 500, Body/Emphasis 14/20 500, Body/Default 14/20 400, Body/Small 13/18 400, Body/Secondary 12/16 400, Label/Caps 11/14 400 uppercase 0.06em.
- IBM Plex Sans via `next/font`; `tabular-nums` utility applied to times, currency, percentages and counts.
- Spacing scale space/1–9 = 4, 8, 12, 16, 20, 24, 32, 40, 48 px.
- Radius tokens: pill 6, control 8, card 10, inset 8, full 9999 (numeric values from UI Spec §5.3 because Figma radius variables did not expose values — confirm in F0-01).
- Rail gradient style: vertical #07727D → #0C9BA9.
- Global visible focus ring on all interactive elements; body text min 13px.
- shadcn/ui initialised with its CSS variables mapped to the tokens above.
- Contrast test over an approved foreground/background pair list.

## Out of Scope
- Composite components (F0-14)
- App shell (F0-15)
- Dark mode (not in sources)

## Functional Requirements
- Components reference tokens only; raw hex values outside the token file fail lint (PROPOSED custom lint or grep test).

## UI / UX Requirements
- White text never on #0C9BA9; coral (#E69A81) never used as a fill behind text; status never conveyed by colour alone (UI-§5.1).

## Dependencies
- Features: F0-02 (Tooling baseline: TypeScript, lint, format, test runners)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-39

## Inputs
- Figma variables

## Outputs
- Tailwind theme / CSS variables
- Font setup
- Token contrast tests

## Error / Edge Cases
- Tailwind v4 (CSS-first `@theme`) vs v3 (`tailwind.config.ts`) depends on scaffold — follow the installed major version.

## Security / Permissions
- None.

## Technical Considerations
- Token source file `src/styles/tokens.css` (or theme config) is the single source; a JSON fixture of Figma values backs the token test.
- Tailwind v4 is expected (postcss.config.mjs present): tokens as CSS variables in `@theme` inside globals.css/tokens.css.

## Traceability
- Product requirements: REQ-N2 (WCAG 2.1 AA: 4.5:1 text contrast, 44×44px targets, visible focus, status not by colour alo…), REQ-N3 (Visual system follows Figma Foundations tokens, IBM Plex Sans, 88px rail, 76px header, 144…)
- Sources: FIG (01 · Foundations: colour, type ramp, spacing, radius, rail gradient); UI-§5; DD §6–7; ADR-02 Part 2
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
