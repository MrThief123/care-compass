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
- Human confirmation: MrThief123, 2026-10-01 (in-session) — accepted as-is; per-recipient tracking is a bigger schema change, deferred unless it proves disruptive in practice.
- Update 2026-10-02: the seed.sql failure was **not reproducible**. `supabase db reset --local` (CLI 2.117.0, main at 44831b6) ran twice with no error and loaded 14 users, 14 profiles, 2 organisations and 8 clients; `seed.sql` is unchanged since F0-16. Closed as not reproducible on the human's instruction; reopen if it recurs, with `supabase db reset --debug` output and the CLI version. `seed_users` is `on commit drop`, which would break if a CLI version ran each statement in its own transaction — the likeliest explanation, unconfirmed.

### FD-03 — pgTAP snapshot row count compared against `budget_buckets`, not the literal 1
- Date: 2026-10-01 (second session)
- Context: `supabase/tests/budget_threshold_notifications.test.sql` test 9 asserted `count(*) from budget_thresholds_snapshot()` = 1. pgTAP runs inside a transaction on the existing local database, so any seed or leftover integration-test bucket makes it fail (`have: 71, want: 1` on this stack). `supabase test db` therefore failed (539/540), though the first session recorded 540/540 on a then-empty database.
- Decision: genuine test bug (environment-dependent assumption). Before: `= 1`, "one row for the one bucket that exists". After: `= (select count(*) from budget_buckets where removed_at is null)`, "one row for every bucket that exists (system-wide, not one client's)". The per-bucket assertions on the test's own bucket (tests 10–14) are unchanged.
- Reason: identical on an empty database, and still checks the function is system-wide; no assertion removed, no behaviour changed.
- Human confirmation required: no (test bug fix, no behaviour change)
- Test changes caused: pgTAP test 9 in `budget_threshold_notifications.test.sql`, as above.

### FD-04 — Due thresholds come from `percent_used`, not F0-12's `threshold_state`
- Date: 2026-10-01 (second session)
- Context: the job picked thresholds from `threshold_state`. F0-12's `budget_threshold_state()` returns 'depleted' whenever any cost is pending (PD-058), whatever the percentage. A bucket at 40% with one pending cost therefore sent the 75, 85 and 100 emails, each saying "has reached 40% of its allocation" — misleading, and it pre-empts CHG-020's separate (unspecified) pending-cost email.
- Decision: a threshold is due when `percent_used >= threshold` (PD-032's 75/85/100 constant); a null `percent_used` (no funds left this period to measure against) sends nothing. New test T-01b written first and seen failing (6 emails) before the fix.
- Reason: the email states a percentage (AC-01, CIS5 wording); it should only go when that percentage has actually reached the threshold.
- Alternatives considered: keep `threshold_state` (rejected: misleading copy); treat pending as 100% (rejected: that is CHG-020's pending-cost email, whose trigger and wording are undecided).
- Consequences: a bucket that is pending-only or exhausted from earlier periods (`percent_used` null) gets no threshold email from INT-01. That case is what CHG-020's pending-cost email would cover — see PROGRESS.md Remaining.
- Human confirmation required: yes — HUMAN REVIEW (behaviour change in the job; no existing test expectation changed)
- Test changes caused: none changed; T-01b added.
- Human confirmation: MrThief123, 2026-10-01 (in-session) — accepted.

### FD-05 — CHG-020 pending-cost email and the threshold email's missing bucket name are out of this PR (CHG-044)
- Date: 2026-10-01 (second session)
- Context: DEVELOPMENT_PLAN.md's INT-01 card carries a note from the original project-wide CHG-020 ("also email Family and admins when an event cost goes pending"), but this feature's own PRD.md/ACCEPTANCE_CRITERIA.md never incorporated it — no AC, no scope line, trigger/idempotency/wording unspecified — so it was never built. Separately, the threshold email's CIS5 wording names only the client, not which bucket crossed (a gap for multi-bucket clients).
- Decision: both are out of INT-01's scope. The pending-cost email is tracked as root PRD.md Parking lot item PL-25; the bucket name as PL-26. Root DECISIONS.md CHG-044 records the split. INT-01 ships with its original 5 ACs (threshold emails only), unaffected.
- Reason: human chose to split the pending-cost email into its own feature rather than hold this PR, and to treat the bucket name as a fast-follow rather than fix it now — in both cases to let INT-01 (code and tests complete) go to PR.
- Alternatives considered: fold the pending-cost email into INT-01 under a new AC (rejected: trigger/idempotency/wording still unspecified — would need its own PRD work first, not a PR-blocking fix); fix the bucket name now (rejected: `budget_thresholds_snapshot()` would need a bucket-name column and agreed copy — small but not zero scope, and not required by any current AC).
- Consequences: INT-01's emails keep the exact CIS5 wording and do not cover pending costs; both are real, tracked gaps (PL-25, PL-26), not forgotten.
- Human confirmation required: yes — HUMAN REVIEW
- Human confirmation: MrThief123, 2026-10-01 (in-session) — split into PL-25 and PL-26 per root DECISIONS.md CHG-044.
- Test changes caused: none.

### FD-06 — Vercel Cron authentication (CHG-046)
- Date: 2026-10-02
- Context: OQ-17/PD-050 left "Vercel Cron or pg_cron"; the human chose Vercel Cron. Vercel Cron sends `GET` with `Authorization: Bearer $CRON_SECRET`; the route only took `POST` + `x-jobs-secret`.
- Decision: add `GET` checking `CRON_SECRET` (separate from `JOBS_SECRET`, so neither secret opens the other path); keep `POST` + `JOBS_SECRET` for manual runs; schedule in `vercel.json` daily at `0 21 * * *` UTC.
- Reason: smallest change that fits the platform's fixed call shape, with the same constant-time check and bare 401 as AC-04.
- Alternatives considered: one shared secret for both methods (rejected: a leaked manual-trigger secret would also open the cron path and vice versa, and Vercel's bearer secret is set by Vercel's `CRON_SECRET` convention); pg_cron (not chosen by the human).
- Consequences: `CRON_SECRET`, `JOBS_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `SUPABASE_SERVICE_ROLE_KEY` must be set in the Vercel project before the first scheduled run; until then the job returns 401 or throws its clear missing-env error. Not run against a real Vercel deployment or Resend account.
- Human confirmation required: yes — HUMAN REVIEW (set the variables; check the first scheduled run in Vercel's cron logs)
- Test changes caused: none (new tests in `src/app/api/jobs/budget-thresholds/route.test.ts`).
- Human confirmation: Dhruv Verma, 2026-10-02 (in-session).

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
