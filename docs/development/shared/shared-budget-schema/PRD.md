# F0-12 — Budget buckets, fund top-ups, spending and summary calculation

| Field | Value |
|---|---|
| Feature ID | F0-12 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-budget-schema` |
| Documentation | `docs/development/shared/shared-budget-schema/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D6 |
| Status / owner | See PROGRESS.md |

## Purpose
Provide correct money arithmetic and budget state.

## Problem
Floating-point money and multi-step client writes corrupt budgets; the bucket model and thresholds are still being decided.

## Description
Stores each client's funding buckets, fund top-up history and spending; calculates total, used, remaining, percent used and threshold state atomically in Postgres.

## User value
Families and organisations see exactly how much is left; the basis for threshold warnings.

## Users
- Family
- Admin
- Carer

## Scope
- `budget_buckets`: id, client_id, kind (per OQ-04; design shows NDIS, Fixed, Government), label, period_start, period_end.
- `budget_fund_entries` (top-ups, append-only): id, bucket_id, amount numeric(12,2) > 0, description, entry_date, recorded_by.
- `budget_expenses`: id, bucket_id, client_id, amount numeric(12,2) > 0, description, spent_on, event_id null, receipt_document_id null, recorded_by.
- View/function `budget_bucket_summary(client_id)` → total (sum of fund entries in period), used, remaining (may be negative), percent_used, threshold_state ('normal'|'warning'|'alert'|'depleted' using thresholds per OQ-03).
- Postgres functions `add_funds(bucket_id, amount, description, entry_date)` and `record_expense(...)` performing validated, atomic writes.
- RLS per OQ-05 (default PROPOSED: family manages funds; carer/admin read summaries; expense recording rights decided in OQ-05).
- TypeScript money formatting helper (AUD, no cents when whole, tabular) — display only; arithmetic stays in SQL.

## Out of Scope
- Budget UI (FAM-03, FAM-10, FAM-11)
- Threshold emails (INT-01)
- Funding-source restrictions and inter-bucket transfer rules (out of scope per CM-0309, parked PL-10)

## Functional Requirements
- Spending is never blocked; remaining may go below zero and state becomes 'depleted' (CIS5 Q&A).
- Percent used rounds to nearest whole percent for display (design shows 38%, 45%, 92%).

## UI / UX Requirements
- None directly.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-08 (Append-only audit log capture)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-03, OQ-04, OQ-05
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-24, OQ-28

## Inputs
- Fund entries
- Expenses

## Outputs
- Bucket summaries

## Error / Edge Cases
- Bucket with zero total → percent_used null and state 'normal' (display per OQ-24).
- Entries outside the bucket's period excluded from the period summary.

## Security / Permissions
- Amounts never accepted as floats from clients; validated as decimal strings with max 2 dp.
- Fund entries and expenses are append-only; corrections are reversing entries (PROPOSED).

## Technical Considerations
- numeric(12,2); percent computed as round(used/total*100).

## Traceability
- Product requirements: REQ-27 (Each funding bucket shows $ remaining, $ total and % used individually; buckets in trouble…), REQ-28 (Spending automatically deducts from the relevant bucket; remaining = total − spending; ove…), REQ-29 (Funds are added/edited only on the Budget screen by authorised people, with a dated histor…), REQ-N12 (Money stored as exact decimals; multi-table financial writes are atomic.)
- Sources: BRIEF IV, item 5; CIS3 Data Entry 5; CIS5 Notifications (sub-element transfers); CM-0309 (predefined categories; funding rules out of scope); CM-0409 (auto deduct; org can edit family budgets); UI-D1, D4, D7, D17, D19; ADR-01 (NUMERIC, transactions); Design: Family Home budget strip, Family Budget
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
