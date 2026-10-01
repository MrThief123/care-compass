# Decisions — INT-01 Automatic budget threshold emails

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-03 | Budget threshold percentages | YES | Follow the client's 75/85/100 unless the client approved D4; make thresholds a single configuration constant. |
| OQ-17 | Hosting, email, scheduler, environments and availability | YES | Vercel (or equivalent) + Supabase paid tier; Resend (or Supabase SMTP) for email; Vercel Cron or pg_cron for jobs — confirm budget with client. |
| OQ-28 | Budget email recipients and budget period | YES | Family + current organisation admins; registry parked (PL-02); period = bucket period. |

## Feature decisions log

### FD-01 — Each crossed threshold sends (PRD's proposed default), and a partial-recipient failure is treated as a whole-threshold failure
- Date: 2026-10-01
- Context: PRD Functional Requirements marks "spending that jumps past several thresholds sends each crossed threshold once — or only the highest (confirm)" as PROPOSED, non-blocking. Separately, the PRD specifies "at most once per bucket per period" and AC-05's "not recorded as sent" on a provider error, but says nothing about a run with several eligible recipients where only some sends succeed.
- Decision: (a) Used the documented proposed default — a bucket that jumps straight to 100% sends the 75%, 85% and 100% emails, not only the highest (`thresholdsMet()` in `src/server/jobs/budget-thresholds.ts`). (b) For a threshold with multiple recipients, if any recipient's send fails, the whole threshold is left unrecorded (not just that recipient), so the next run retries every recipient for it.
- Reason: (a) is explicitly the PRD's own stated default. (b) is the simplest behaviour consistent with the schema, which has no per-recipient tracking (`budget_threshold_notifications` is keyed by bucket/threshold/period only, not recipient) — adding one would be scope the PRD doesn't ask for.
- Alternatives considered: per-recipient notification rows (rejected: not in the data model PRD Scope specifies, and no AC needs it); sending only the highest threshold (rejected: contradicts the proposed default).
- Consequences: a transient failure affecting one of several recipients causes the others to receive a duplicate email on retry. Given this is a STRETCH feature and emails are informational (not safety-critical), this is an acceptable trade-off; worth a human decision if it ever proves disruptive in practice.
- Human confirmation required: yes — HUMAN REVIEW (non-blocking per CLAUDE.md §2, but flagging since (a) was a PROPOSED item)
- Test changes caused: none

### FD-02 — Resend via raw `fetch`, test fixtures created per test rather than loaded from F0-16 seed data
- Date: 2026-10-01
- Context: OQ-17 names "Resend (or Supabase SMTP)". This session's local Supabase stack could not load `supabase/seed.sql` via `supabase db reset` (`ERROR: relation "seed_users" does not exist` — the CLI appears to batch the seed file across connections, breaking its own temporary table; reproduced twice, unrelated to this feature's migration, not investigated further as out of scope).
- Decision: Implemented `ResendEmailProvider` with a plain `fetch` POST to `https://api.resend.com/emails` (no SDK — ARCHITECTURE.md §7 "no second library for an existing concern"). Integration tests seed their own organisation/profiles/client/bucket via `createAdminClient()` rather than depending on F0-16 fixtures, as TEST_PLAN.md's "unless a test creates its own fixtures" already allows.
- Reason: Raw `fetch` is all a single JSON POST needs. Self-seeded fixtures were already permitted and avoided depending on an unrelated, apparently environment-specific seeding failure.
- Alternatives considered: Supabase SMTP via the local Inbucket catcher (would also have worked and needs no API key, but a second local-only code path for sending mail was more than this feature needs — `EmailProvider`/`FakeEmailProvider` already isolate the choice behind one interface, so either can be swapped in later without touching the job).
- Consequences: nothing in this feature was tested against a real Resend account — `RESEND_API_KEY`/`RESEND_FROM_EMAIL` are unset in `.env.local`; the route handler will throw a clear error if triggered for real before those are set. The `supabase/seed.sql` batching failure is unresolved and will affect any other feature relying on `supabase db reset`'s auto-seed in this kind of environment; `npm run db:seed` alone cannot recover from it either (it expects the base seed to already exist).
- Human confirmation required: yes — HUMAN REVIEW (set `RESEND_API_KEY`/`RESEND_FROM_EMAIL`/`JOBS_SECRET` before relying on this in any real environment; separately investigate the seed.sql failure if it recurs for other features)
- Test changes caused: none

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
