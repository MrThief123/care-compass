# FAM-11 — Family — Update funds

| Field | Value |
|---|---|
| Feature ID | FAM-11 |
| Dashboard / stream | Family |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `family-dev` |
| Feature branch | `feature/family-budget-update-funds` |
| Documentation | `docs/development/family-dev/family-budget-update-funds/` |
| Lane | F — Family |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The screen UI is delivered on fixtures by **FAM-UI-05**. Where this PRD's Scope describes layout or visual components, treat them as already built: verify them, then replace fixture data with the Supabase data source, add server actions, permissions and persistence, and make the acceptance criteria pass against real data. Shared components live in the UI kit (UI-01/UI-02/UI-03) — change them only through a shared PR.

## Purpose
Record fund top-ups.

## Problem
The Update interaction is not designed and who may edit is contradictory.

## Description
Lets the authorised person record a fund top-up against a bucket, producing a History entry and updated totals.

## User value
Budgets stay accurate as new funding arrives.

## Users
- Family (per UI-D1; Organisation per CM-0409 — OQ-05)

## Scope
- 'Update' primary button on Funds by source.
- Update form (modal or panel — design required): bucket, amount, date, description; calls `add_funds`.
- Success updates cards and History without full reload.

## Out of Scope
- Editing/removing past entries
- Inter-bucket transfers (parked PL-10)

## Functional Requirements
- Amount > 0 with max 2 decimals.

## UI / UX Requirements
- BLOCKED until the Update interaction is designed.

## Dependencies
- Features: FAM-10 (Family — Budget overview and history)
- Blocking open decisions (must be answered before START FEATURE): OQ-05, OQ-04, OQ-19
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-03

## Inputs
- bucket, amount, date, description

## Outputs
- budget_fund_entries row

## Error / Edge Cases
- Date in the future → PROPOSED reject.

## Security / Permissions
- Authorisation per OQ-05.

## Technical Considerations
- Server Action wrapping `add_funds`.

## Traceability
- Product requirements: REQ-29 (Funds are added/edited only on the Budget screen by authorised people, with a dated histor…)
- Sources: UI-D1 (only Family adds funds); UI-D19 (fund editing on Budget screen only); CM-0409 (organisations can edit family budgets); Design: Family · Budget 'Update' button
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
