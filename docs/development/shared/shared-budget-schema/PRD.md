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
Rewritten 2026-09-27 for CHG-020 / CHG-021 / CHG-022 (PD-058, PD-059, PD-060); see DECISIONS.md FD-01.
- `budget_buckets`: a client's open buckets, each with a free name (unique per client ignoring case, max 40) and an optional kind (ndis / fixed / government). A bucket is added with a starting amount ($0 allowed), renamed, and removed only when nothing was ever charged to it; events that used it move, with their cost, to a Miscellaneous bucket.
- `budget_fund_entries` (append-only ledger): funds added, funds removed, bucket added, bucket removed; signed `numeric(12,2)`, with the recorder, a name snapshot and the save's optional note.
- `budget_costs`: one row per completed occurrence of an event that has a cost, `paid` or `pending`, with `incurred_on` and `paid_on`.
- `care_events.cost` and `care_events.bucket_id` (both or neither): the optional cost of an event and the bucket it is paid from.
- Completing an occurrence (a `done` row in `care_event_completions`) charges the cost once: paid if the bucket can cover it in full and nothing is pending, otherwise the whole cost is held pending. The occurrence always completes.
- `add_funds` pays the bucket's pending costs whole, oldest first, stopping at the first the balance cannot cover. `remove_funds` is refused above the balance.
- `budget_bucket_summary(client_id)` → per bucket: total, used, remaining (cumulative: the balance carries over), period_start, period_end, period_used (a period is a calendar month, Melbourne, FD-06), percent_used (this month's spend against the funds available at its start), threshold_state ('normal' | 'warning' | 'alert' | 'depleted', 75 / 85 / 100), pending_total, pending_count.
- Only the carer who created an event, the family or an admin can change its cost and bucket (`set_event_cost`, and a guard on `care_events`).
- RLS: family and the client's organisation admins change the budget (PD-058); family, admins and assigned carers read it; carers never change it by hand.
- TypeScript money helpers: a Zod decimal-string schema (max 2 dp) and cents in `formatMoney` when the amount is not whole. Display only; arithmetic stays in SQL.

## Out of Scope
- Budget UI (FAM-03, FAM-10, FAM-11)
- Threshold emails (INT-01)
- Funding-source restrictions and inter-bucket transfer rules (out of scope per CM-0309, parked PL-10)

## Functional Requirements
- Completing care is never blocked by money (PD-058): a cost the bucket cannot cover is held pending, never part-paid. Remaining never goes below zero. This replaces the earlier overdraft rule (CIS5 Q&A).
- A pending cost stays until paid: it survives its event being deactivated and carries over indefinitely (human, 2026-09-27).
- Percent used rounds to nearest whole percent for display (design shows 38%, 45%, 92%).

## UI / UX Requirements
- None directly.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-08 (Append-only audit log capture)
- Blocking decisions: OQ-01, OQ-03, OQ-04, OQ-05 (all ANSWERED: PD-032, PD-033, PD-034; amended by PD-058, PD-059, PD-060)
- Non-blocking (proposed defaults apply): OQ-24 (OPEN), OQ-28 (answered, PD-035)

## Inputs
- Fund entries
- Expenses

## Outputs
- Bucket summaries

## Error / Edge Cases
- Bucket with zero total → percent_used null and state 'normal' (display per OQ-24), or 'depleted' if it has a pending cost.
- A period is a calendar month (FD-06): unspent funds carry over; a pending cost carries over until paid.

## Security / Permissions
- Amounts never accepted as floats from clients; validated as decimal strings with max 2 dp.
- Fund entries are append-only and costs only move from pending to paid; corrections are further entries (funds removed, bucket removed).
- All writes go through SECURITY DEFINER functions; the actor is always `auth.uid()`. Authenticated users can only select.

## Technical Considerations
- numeric(12,2); percent computed as round(used/total*100).

## Traceability
- Product requirements: REQ-27 (Each funding bucket shows $ remaining, $ total and % used individually; buckets in trouble…), REQ-28 (Spending automatically deducts from the relevant bucket; remaining = total − spending; ove…), REQ-29 (Funds are added/edited only on the Budget screen by authorised people, with a dated histor…), REQ-N12 (Money stored as exact decimals; multi-table financial writes are atomic.)
- Sources: BRIEF IV, item 5; CIS3 Data Entry 5; CIS5 Notifications (sub-element transfers); CM-0309 (predefined categories; funding rules out of scope); CM-0409 (auto deduct; org can edit family budgets); UI-D1, D4, D7, D17, D19; ADR-01 (NUMERIC, transactions); Design: Family Home budget strip, Family Budget
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
