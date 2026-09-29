# Decisions — CAR-05 Carer — Calendar (shifts)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Status |
|---|---|---|---|
| OQ-33 | Carer calendar and task semantics | YES | ANSWERED (PD-043; amended by CHG-025, CHG-030, CHG-031) |
| OQ-32 | Timezone | no | Australia/Melbourne for all date logic |

## Feature decisions log

### FD-01 — Feature docs rewritten to the current design
- Date: 2026-09-29
- Context: the generated PRD/ACs described `/carer/calendar` with three event blocks and a 'Tasks for the selected shift' panel. CHG-025 (shifts, no tasks), CHG-030 (`getCarerShifts`) and CHG-031 (merged into Carer Home, no route) made them obsolete; the plan card already says this feature "wires `getCarerShifts`".
- Decision: PRD Scope, ACCEPTANCE_CRITERIA (AC-01 to AC-10), TEST_PLAN and USER_STORIES rewritten before any code, as CHG-025/030 direct.
- Human confirmation: covered by CHG-030/031 (Dhruv Verma, 2026-09-26); the new ACs are for review at the PR.

### FD-02 — Ownership, cancelled shifts, past-shift names (answers 2026-09-29)
- CAR-05 owns wiring `getCarerShifts` for Carer Home; CAR-01 does not repeat it (human).
- Cancelled shifts are hidden from the calendar (human, chosen over a 'cancelled' block state, which no design shows).
- A past shift keeps the client's name through `get_carer_shifts`; the name is the **full** name (human) — recorded as CHG-032 in root DECISIONS.md, with the everywhere-sweep left unscheduled.

### FD-03 — Test expectations changed by CHG-032 — HUMAN REVIEW
- Tests: `queries.test.ts` (CAR-UI-01 AC-01, CAR-UI-03 AC-07 rows), `carer-home-calendar.test.tsx` (T-01, T-05), `carer-home.test.tsx` (AC-01).
- Before: `clientFirstName: 'Margaret'`, block title 'Margaret'. After: `clientName: 'Margaret Doyle'`, block title 'Margaret Doyle'.
- Reason: recorded requirement change (CHG-032). No assertion removed. Notification text '(Margaret)' is unchanged here (CAR-02).

### FD-04 — Migration outside Lane C
- `supabase/migrations/<timestamp>_carer_shifts_rpc.sql` and regenerated `database.types.ts` are shared-lane files; allowed by CHG-032 and flagged for review in the PR. Chosen over widening the `clients` RLS policy, which would break PD-041's no-lookback rule.
