# F0-14 — Core UI primitives and state components

| Field | Value |
|---|---|
| Feature ID | F0-14 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-ui-primitives` |
| Documentation | `docs/development/shared/shared-ui-primitives/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D2 |
| Status / owner | See PROGRESS.md |

## Purpose
Implement shared primitives once with full state coverage.

## Problem
Each dashboard uses the same pills, cards, tiles and states; duplication would drift.

## Description
Builds the reusable components that appear across all three dashboards in the Figma screens and the '06 · States' sheet.

## User value
Consistent, accessible building blocks so dashboard features only compose, never re-invent.

## Users
- All users

## Scope
- Icon library `lucide-react` (shadcn default) with an `Icon` wrapper (sizes 14/16/20) covering rail and card icons: home, info, calendar, dollar, sliders, patient/person, clipboard-check, bell, search, file, plus, check, alert-triangle, chevrons, x.
- Avatar (sm 28 / md 32 / lg 46; initial on brand-pale ground).
- Button (primary brand-deep fill / secondary outline / ghost link; md / lg; disabled).
- Status pill: planned (outline, 'Planned'), done (brand-pale fill, check icon, 'Done · Aisha R.'), overdue (alert outline, warning icon, 'Overdue'); never colour alone.
- Count badge (neutral / alert), Progress bar (normal brand / alert-strong).
- Card shell (neutral / alert tone with border/alert and bg/alert).
- Checkbox (checked label struck through and muted, as in Tasks panels).
- Segmented control D / W / M (default W).
- Search field with clear button and states: empty, typing, loading, no-results ('No matches for "Zoe".').
- File tile: filled (file icon + filename) and add ('+ Add file', dashed border).
- EmptyState (icon, title, body — e.g. 'All caught up / There are no overdue tasks right now.'), ErrorState ('Something went wrong / We couldn't load this page. Please try again.' + Retry), Skeletons (list rows with avatar; card grid).
- Component tests including axe accessibility assertions.

## Out of Scope
- Rail and header (F0-15)
- Calendar grids (FAM-04)
- Date picker grid (FAM-06)
- Confirmation modal (FAM-13)
- Slot chips (ADM-07)

## Functional Requirements
- All interactive primitives keyboard operable with ≥44×44px targets.

## UI / UX Requirements
- Visuals follow the Figma screens and tokens exactly.

## Dependencies
- Features: F0-05 (Design tokens, typography and base styles)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-39

## Inputs
- Props

## Outputs
- Components in src/components/ui and src/components/shared

## Error / Edge Cases
- Very long actor names in Status pill truncate with full name in accessible label.

## Security / Permissions
- None.

## Technical Considerations
- shadcn/ui primitives restyled with tokens; one component per file; stories optional (not required).

## Traceability
- Product requirements: REQ-N1 (Usable by non-technical users aged 55–80 and carers on shared laptops; plain language; des…), REQ-N2 (WCAG 2.1 AA: 4.5:1 text contrast, 44×44px targets, visible focus, status not by colour alo…), REQ-N3 (Visual system follows Figma Foundations tokens, IBM Plex Sans, 88px rail, 76px header, 144…), REQ-17 (Exactly three statuses — Planned, Done, Overdue — never conveyed by colour alone; Overdue …), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…)
- Sources: UI-§6 Component inventory; UI-D11, D18, D20, D32, D33; Design: 06 · States sheet (empty, loading, error); Design: all screens
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
