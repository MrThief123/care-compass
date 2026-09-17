# FAM-03 — Family Home — Budget strip

| Field | Value |
|---|---|
| Feature ID | FAM-03 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-home-budget-strip` |
| Documentation | `docs/development/family-dev/family-home-budget-strip/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D8 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-01**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Show the financial position at a glance.

## Problem
One aggregate bar hid a bucket at 92%.

## Description
Bottom strip on Family Home showing '$17,870 remaining of $32,000 · 44% used' and one card per funding bucket.

## User value
The bucket in trouble is visible instead of hidden in an average (D17).

## Users
- Family

## Scope
- Card: title 'Budget', aggregate line '$X remaining of $Y · Z% used', 'View breakdown' link (to Budget, FAM-10; omitted until merged).
- One bucket card per bucket: Label/Caps bucket name, Metric/Large remaining, 'of $total · N% used', progress bar.
- Alert state (≥ alert threshold): alert border and ground, warning icon top-right, remaining and bar in alert colours.
- Empty state when no buckets (OQ-24 copy PROPOSED 'No funding set up yet').

## Out of Scope
- Budget screen (FAM-10)
- Update funds (FAM-11)
- Threshold emails (INT-01)

## Functional Requirements
- Figures from `budget_bucket_summary`; display rounding whole dollars when cents are zero.

## UI / UX Requirements
- Match design; warning state visual (70%) not drawn — PROPOSED use normal card with warning icon only; confirm.

## Dependencies
- Features: F0-12 (Budget buckets, fund top-ups, spending and summary calculation), FAM-UI-01 (Family Home screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-03, OQ-04
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-24

## Inputs
- clientId

## Outputs
- Budget strip

## Error / Edge Cases
- Negative remaining → show '-$120' in alert colours and 'depleted' state (PROPOSED).

## Security / Permissions
- Only linked family can view (and others per OQ-05 on their own screens).

## Technical Considerations
- Server Component; money formatter from F0-12.

## Traceability
- Product requirements: REQ-27 (Each funding bucket shows $ remaining, $ total and % used individually; buckets in trouble…), REQ-28 (Spending automatically deducts from the relevant bucket; remaining = total − spending; ove…)
- Sources: UI-§7.1; UI-D7, D17; US P-6; Design: Family · Home budget strip
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
