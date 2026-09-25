# CAR-08 — Carer — Record an expense

| Field | Value |
|---|---|
| Feature ID | CAR-08 |
| Dashboard / stream | Carer |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `carer-dev` |
| Feature branch | `feature/carer-record-expense` |
| Documentation | `docs/development/carer-dev/carer-record-expense/` |
| Lane | C — Carer |
| Sprint | POST-SPRINT · planned — |
| Status / owner | See PROGRESS.md |

> **RETIRED by CHG-020 / PD-058 (2026-09-25).** Carers never change the budget by hand; do not build this feature. Kept for traceability.

> **Plan v0.2 — post-sprint.** No design exists; needs design and decisions OQ-04/OQ-05/OQ-19 before UI or wiring.

## Purpose
Capture expenses.

## Problem
No design exists and expense-recording rights and bucket model are undecided.

## Description
Lets carers record care-related spending, optionally linked to an event, with receipt upload.

## User value
Spending is captured when it happens and budgets stay correct (CM-0409).

## Users
- Carer

## Scope
- Expense form (design required).
- Call `record_expense`.
- Receipt upload via F0-13.

## Out of Scope
- Purchase verification (out of scope CM-0409)
- Blocking overspend (never, CIS5)

## Functional Requirements
- Budget summary updates immediately.

## UI / UX Requirements
- BLOCKED until designed.

## Dependencies
- Features: F0-12 (Budget buckets, fund top-ups, spending and summary calculation), F0-13 (Client document storage)
- Blocking open decisions (must be answered before START FEATURE): OQ-19, OQ-04, OQ-05
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-03

## Inputs
- amount, bucket, description, date, receipt

## Outputs
- Expense

## Error / Edge Cases
- Expense exceeding remaining → saved and bucket flagged depleted.

## Security / Permissions
- Per OQ-05.

## Technical Considerations
- Server Action.

## Traceability
- Product requirements: REQ-28 (Spending automatically deducts from the relevant bucket; remaining = total − spending; ove…), REQ-30 (Care-related expenses can be recorded (amount, date, description, receipt), optionally lin…)
- Sources: BRIEF V, item 5; CIS3 Data Entry 3, 5; CM-0309 (purchases linked to tasks record expense); CM-0409 (auto deduct); Sequence UC2 (cost); US C-11; UC-C06
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
