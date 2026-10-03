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

> **Added by CHG-047, 2026-10-02.** Schedules REQ-33. **OQ-40 ANSWERED 2026-10-03 (PD-062):** one email per overdue task, once, 30 minutes after the due time, to Family and the organisation's current admins; no upcoming-care reminders in v1; no quiet hours. Cadence (daily Vercel Cron, Hobby plan) is FD-02 in this feature's DECISIONS.md.

## Purpose
Missed care is noticed without anyone having to open the app.

## Problem
REQ-33 (SHOULD, confirmed) asks for alerts for overdue care and reminders for upcoming care. Overdue is shown in the app (REQ-17) but nobody is told. The only emails are INT-01's budget warnings and INT-11's pending-cost emails. PD-062 builds the overdue half; the upcoming-reminder half is deferred.

## Description
A scheduled job, built on INT-01's pieces (`EmailProvider`, Vercel Cron GET with `CRON_SECRET`, the constant-time secret check, record-only-on-full-success idempotency), finds each task occurrence that is overdue by at least 30 minutes (due time = the occurrence's start, as `deriveStatus`), has no completion, and emails the client's Family and active organisation admins once per occurrence. One email per task (no digest). The job reads with the service role and builds occurrences with the pure `buildOccurrences` (F0-11), so recurrence and status come from one place (`src/lib/recurrence`, `deriveStatus`). It looks only at occurrences due in the last 48 hours, so a first run never floods anyone with old items and one missed run is still caught.

## User value
Family and organisations learn about missed care promptly.

## Users
Family and organisation admins (the PD-035 / OQ-28 set INT-01 and INT-11 use). The carer on shift is not emailed.

## Scope
- The job, its tracking table (RLS on, deny-all like `budget_threshold_notifications`), the route and cron entry, tests, docs.

## Out of Scope
- PL-23 (plain-event switch alert) and PL-25 (pending-cost email) stay parked.
- In-app notifications (CAR-02), SMS, push.
- Upcoming-care reminders, quiet hours, a daily digest, and emailing the carer on shift (PD-062: not in v1; each is a new change).

## Functional Requirements
- An occurrence is alerted at most once, across runs and retries (identified by event id and original start, so a rescheduled occurrence is still one occurrence).
- A completed, cancelled or plain-event occurrence is never alerted; nor is a task overdue by less than 30 minutes, or due more than 48 hours ago.
- Never more than 100 alerts (occurrences) in one run; the rest go on the next run.
- A failed send records nothing, so the next run retries.
- Times and "today" use `Australia/Melbourne`; recurrence only via `src/lib/recurrence`.

## UI / UX Requirements
None (email only). Plain text, one task per email; no colour-only meaning. Wording is FD-03 (proposed for the human to confirm).

## Dependencies
- Features: INT-01 (Automatic budget threshold emails), F0-11 (Care events), F0-24 (Auth emails; ensures the sender is set up)
- Blocking open decisions (must be answered before START FEATURE): None. OQ-40 ANSWERED (PD-062).

## Inputs
- Overdue occurrences (due time passed, no completion, task type); the recipient set; job schedule.

## Outputs
- Emails; one tracking row per alert sent.

## Error / Edge Cases
- Provider outage: no tracking row; retried next run.
- Occurrence completed between selection and send: re-check before sending.
- Client with no recipients: skip and log without PII.
- Many overdue items at once: one email per item per recipient (PD-062), capped at 100 occurrences per run; the remainder is sent on later runs.
- A task completed after it was alerted: nothing is sent and the marker stays (it was alerted once).
- A client moved to another organisation: recipients are read fresh, so only the current organisation's admins are emailed.

## Security / Permissions
- The route refuses callers without the secret, constant-time, bare 401 (as INT-01 AC-04). The job reads across clients under the service role in `src/server/jobs/**` only. No PII in logs.

## Technical Considerations
- New table: RLS enabled in the same migration, migration via `supabase migration new`, additive.
- Reuse INT-01's helpers; no second email library, no second scheduler (CHG-046: Vercel Cron).
- Env: no new names beyond INT-01's (`CRON_SECRET`, `JOBS_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`). Names only in `.env.example`.
- Cadence: Vercel Hobby allows crons once a day (FD-02), so a third daily entry `0 21 * * *` like INT-01 and INT-11; an alert can therefore arrive up to about a day after the 30-minute mark.

## Traceability
- Product requirements: REQ-33
- Sources: CHG-047; OQ-40 / PD-062; INT-01; INT-11; PL-03.

## Labels
None PROPOSED.
