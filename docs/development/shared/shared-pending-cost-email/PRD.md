# INT-11 — Email Family and admins when an event cost goes pending

| Field | Value |
|---|---|
| Feature ID | INT-11 (PROPOSED, next free INT number once INT-10 merges) |
| Dashboard / stream | Shared |
| Phase | Phase 4 — Integration, hardening & release |
| Development branch (PR target) | `main` |
| Feature branch | `feature/shared-pending-cost-email` |
| Documentation | `docs/development/shared/shared-pending-cost-email/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D19 (proposed) |
| Status / owner | See PROGRESS.md |

## Purpose
Tell the people who can fix it that a cost could not be paid and needs funds.

## Problem
REQ-37: a cost the bucket cannot cover in full is held as pending and "emailed to Family and admins". INT-01 never built that line (CHG-044 split it out as PL-25). Today a pending cost shows only on the Budget screen; nobody is told. Trigger, idempotency and wording were unspecified; the human settled them on 2026-10-02 (FD-01 to FD-04).

## Description
A scheduled job finds costs that are pending and not yet notified, emails the client's Family and the client's organisation admins, and records that it did so, once per cost.

## User value
Family and admins add funds promptly, so pending costs clear and the bucket is not left silently overdrawn.

## Users
- Family
- Admin (of the client's current organisation)
- Not carers (FD-04)

## Scope
- New job `src/server/jobs/pending-cost-emails.ts`, new Route Handler `src/app/api/jobs/pending-cost-emails/route.ts` (same GET `CRON_SECRET` / POST `JOBS_SECRET` auth as INT-01, CHG-046), new entry in `vercel.json` crons.
- Trigger (FD-01): a cost is first held as pending. In the code this is the `care_event_completions_charge_cost_trg` trigger (migration `20260927000000_budget.sql`, `care_event_completions_charge_cost()`), which inserts `budget_costs` with `status = 'pending'` when the bucket cannot cover the cost whole or an older cost is already pending. That trigger is unchanged; the job reads its result. Paying a cost later never sends anything.
- Idempotency (FD-02): one email per pending cost, ever. A durable marker, new additive table `budget_pending_cost_notifications` (FD-05), is written only after every recipient's send succeeded, so provider failures are retried on the next run and a recorded cost is never emailed again.
- Digest (FD-03, non-blocking, human to confirm): costs that are due in the same run for the same client go in one email per recipient, one line per cost; a single cost is a one-line email. Marker rows are written for every cost in the email.
- Wording (FD-06): each line "A cost of $X for <EVENT> could not be covered by <BUCKET> and is pending." then once at the end "Add funds to pay it. Log in and refer to plan." For one cost this is exactly the approved sentence. Subject "Schedule of Care Program — pending cost" (no names). No client name, no actor name, no other PII.
- Recipients (FD-04): the client's Family members plus active admins of the client's current organisation, active profiles with an email only. Same resolution as INT-01; carers excluded.
- Database function `budget_pending_costs_to_notify()` (SECURITY DEFINER, service role only, like `budget_thresholds_snapshot()`): pending, un-notified costs with bucket name, client id, organisation id.

## Out of Scope
- Any change to how costs are charged, held or paid (F0-12 trigger, `budget_settle_pending`).
- Any change to INT-01 threshold emails (INT-10 owns its wording).
- In-app notification, SMS, per-user preferences, unsubscribe.
- Emailing when a pending cost is paid off, reminders for a cost that stays pending, or emails to carers.
- Immediate (event-driven) sending: the job is scheduled (OQ-17, CHG-046), so an email can lag the completion by up to one cron interval (FD-07).
- Changing `budget_costs` or its guard trigger.

## Dependencies
- Features: INT-01 (merged: `EmailProvider`, `createAdminClient`, recipient pattern, cron route pattern), F0-12 (merged: `budget_costs`, pending model), F0-11 (merged: completions)
- Features that touch the same files: INT-10 edits `budget-thresholds.ts` only; INT-11 adds new files and does not edit it (see DECISIONS.md FD-08 on sharing `resolveRecipients`).
- Blocking open decisions: None (trigger, idempotency, wording, recipients answered by the human 2026-10-02)
- Non-blocking open decisions: FD-03 digest, FD-07 cadence and stale pending, listed in DECISIONS.md

## Inputs
- `budget_pending_costs_to_notify()` rows: cost id, amount, description (event title as charged), bucket name, client id, organisation id.
- `client_family_members`, `profiles` for recipients.

## Outputs
- Emails through `EmailProvider`; rows in `budget_pending_cost_notifications`; a result object `{ emailsSent, costsRecorded, failures }` containing counts and ids only.

## Error / Edge Cases
- Provider failure for any recipient: nothing recorded for that client's batch, next run retries it (INT-01 FD-01 behaviour; a recipient may rarely get a repeat after a partial failure, accepted and recorded).
- No recipients for the client: skip, record nothing (so a later-added Family member or admin does get it), do not fail.
- Cost paid before the job runs (funds added within the interval): no longer pending, not selected, not emailed (FD-07).
- Event deleted after completion: cost row keeps its description, so the email still names it (F0-12 FD-02).
- Bucket removed: cannot happen with costs (`remove_bucket` refuses), so the bucket name always resolves.
- Two overlapping runs: unique key on `cost_id` makes the second insert a no-op; a duplicate send in that tiny window is possible and accepted, as in INT-01.
- Several pending costs across several buckets of one client in one run: one digest, each line names its own bucket.
- Backlog on first deploy: every currently pending cost is un-notified and would be emailed once on the first run. FD-09 asks the human whether to seed existing pending costs as notified.

## Security / Permissions
- Service-role job only; endpoint guarded as INT-01 (bare 401 without the secret).
- New table: RLS enabled, no policies, `revoke all` from anon and authenticated (same as `budget_threshold_notifications`).
- No PII in logs or the job result: no names, amounts, event titles or addresses. Email text is client health and financial data about a vulnerable person: synthetic data only in tests.

## Technical Considerations
- One additive migration (`supabase migration new`): table, index, function. No column or trigger on `budget_costs`: its update guard (`budget_costs_guard_update`) rejects any change other than pending to paid, so a `notified_at` column there would need that guard edited. A separate table avoids touching a table other features read (CLAUDE.md §3).
- No new dependency. Reuse `EmailProvider`, `createAdminClient`.
- Money formatted `$X.XX` (en-AU, 2 decimals) from `numeric(12,2)`; computed in the job, not in SQL.
- Next.js: the route copies INT-01's; read `node_modules/next/dist/docs/` route handler guide before writing it (CLAUDE.md §14).

## Traceability
- Product requirements: REQ-37 (primary), REQ-28
- Sources: PD-058, CHG-044 (PL-25), proposed CHG-051-or-next (DECISIONS.md), INT-01

## Labels
CONFIRMED (human, 2026-10-02: trigger, idempotency, wording, recipients); PROPOSED: digest, marker table, cadence
