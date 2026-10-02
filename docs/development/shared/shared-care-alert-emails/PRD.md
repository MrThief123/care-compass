# INT-09 — Overdue and upcoming care alert emails

| Field | Value |
|---|---|
| Feature ID | INT-09 |
| Dashboard / stream | Shared |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `main` (CHG-036) |
| Feature branch | `feature/shared-care-alert-emails` |
| Documentation | `docs/development/shared/shared-care-alert-emails/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D17–D18 |
| Status / owner | See PROGRESS.md |

> **Added by CHG-047, 2026-10-02.** Schedules REQ-33. **Blocked by OQ-40 (OPEN): the trigger, recipients, timing and wording are not decided. Do not build on a proposed default.** The criteria below are provisional and are rewritten when OQ-40 is answered.

## Purpose
Missed care is noticed without anyone having to open the app.

## Problem
REQ-33 (SHOULD, confirmed) asks for alerts for overdue care and reminders for upcoming care. Overdue is shown in the app (REQ-17) but nobody is told. The only emails are INT-01's budget warnings.

## Description
A scheduled job, built on INT-01's pieces (`EmailProvider`, Vercel Cron GET with `CRON_SECRET`, the constant-time secret check, record-only-on-full-success idempotency), finds care that is overdue (and, if OQ-40 says so, upcoming) and emails the decided recipients once per occurrence. What counts, who gets it, how soon and the wording come from OQ-40.

## User value
Family and organisations learn about missed care promptly.

## Users
Family and organisation admins (recipients, as INT-01 sends to OQ-28's set), subject to OQ-40.

## Scope
- The job, its tracking table (RLS on, deny-all like `budget_threshold_notifications`), the route and cron entry, tests, docs.

## Out of Scope
- PL-23 (plain-event switch alert) and PL-25 (pending-cost email) stay parked.
- In-app notifications (CAR-02), SMS, push.
- Anything OQ-40 does not include.

## Functional Requirements
- An occurrence is alerted at most once per trigger, across runs and retries.
- A completed, cancelled or plain-event occurrence is never alerted.
- A failed send records nothing, so the next run retries.
- Times and "today" use `Australia/Melbourne`; recurrence only via `src/lib/recurrence`.

## UI / UX Requirements
None (email only). Plain, accessible wording per OQ-40; no colour-only meaning.

## Dependencies
- Features: INT-01 (Automatic budget threshold emails), F0-11 (Care events), F0-24 (Auth emails; ensures the sender is set up)
- Blocking open decisions (must be answered before START FEATURE): OQ-40

## Inputs
- Overdue occurrences (due time passed, no completion, task type); the recipient set; job schedule.

## Outputs
- Emails; one tracking row per alert sent.

## Error / Edge Cases
- Provider outage: no tracking row; retried next run.
- Occurrence completed between selection and send: re-check before sending.
- Client with no recipients: skip and log without PII.
- Many overdue items at once: per OQ-40 (one per item or a digest); never unbounded sends in one run.

## Security / Permissions
- The route refuses callers without the secret, constant-time, bare 401 (as INT-01 AC-04). The job reads across clients under the service role in `src/server/jobs/**` only. No PII in logs.

## Technical Considerations
- New table: RLS enabled in the same migration, migration via `supabase migration new`, additive.
- Reuse INT-01's helpers; no second email library, no second scheduler (CHG-046: Vercel Cron).
- Env: no new names expected beyond INT-01's. Names only in `.env.example`.

## Traceability
- Product requirements: REQ-33
- Sources: CHG-047; OQ-40; INT-01; PL-03.

## Labels
None PROPOSED.
