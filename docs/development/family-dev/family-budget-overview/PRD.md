# FAM-10 — Family — Budget overview and history

| Field | Value |
|---|---|
| Feature ID | FAM-10 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-budget-overview` |
| Documentation | `docs/development/family-dev/family-budget-overview/` |
| Lane | F — Family |
| Sprint | SPRINT · planned D10 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-05**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Present the budget in detail.

## Problem
Design History shows only fund top-ups; whether expenses also appear is undecided (OQ-05).

## Description
The Family Budget screen: per-bucket remaining/total/percent and a dated history of top-ups.

## User value
Families understand where money came from and how much is left (D7).

## Users
- Family

## Scope
- Route `/family/[clientId]/budget`.
- Card 'Funds by source' with bucket cards (reuse BudgetBucketCard) — 'Update' button slot reserved for FAM-11.
- History table: Date · Description · Amount (e.g. '3 Nov 2026 · NDIS quarterly plan top-up · +$6,000'), newest first.
- Wire Home 'View breakdown' link to this route.

## Out of Scope
- Update funds flow (FAM-11)
- Expense entries in history (OQ-05)

## Functional Requirements
- Amounts shown with sign and tabular numerals.

## UI / UX Requirements
- Progress bar colours: follow tokens consistently with Home (OQ-39 notes Budget screen bars differ in the image).

## Dependencies
- Features: F0-12 (Budget buckets, fund top-ups, spending and summary calculation), FAM-UI-05 (Family Budget screen (UI))
- Blocking open decisions (must be answered before START FEATURE): OQ-04, OQ-05
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-24, OQ-39

## Inputs
- clientId

## Outputs
- Budget page

## Error / Edge Cases
- No history → empty state (PROPOSED 'No funds recorded yet').

## Security / Permissions
- Linked family only on this route.

## Technical Considerations
- Server Component.

## Traceability
- Product requirements: REQ-27 (Each funding bucket shows $ remaining, $ total and % used individually; buckets in trouble…), REQ-28 (Spending automatically deducts from the relevant bucket; remaining = total − spending; ove…), REQ-29 (Funds are added/edited only on the Budget screen by authorised people, with a dated histor…)
- Sources: UI-D7, D19; US P-6, P-9; Design: Family · Budget
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
