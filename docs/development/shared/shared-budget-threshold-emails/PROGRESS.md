# Progress — INT-01 Automatic budget threshold emails

Status: MERGED TO DEV (merged to `main` in #190, 2026-10-01)
Owner: MrThief123
Lane: B — Backend
Sprint: STRETCH · planned D11–D12
Branch: `feature/shared-budget-threshold-emails`
PR target: `main` (OQ-01 Option B, CHG-036)
Last updated: 2026-10-01

## Blockers
- None — OQ-01, OQ-03, OQ-17, OQ-28 all ANSWERED

## Dependencies status
- F0-12 — MERGED TO DEV
- FAM-10 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Migration `20261001080936_budget_threshold_notifications.sql`: `budget_threshold_notifications`
  table (deny-all RLS, unique on bucket/threshold/period) and `budget_thresholds_snapshot()` (a
  system-wide, SECURITY DEFINER sibling of F0-12's `budget_bucket_summary()`, for the job's own
  use — reuses `budget_threshold_state()`/`budget_today()` rather than duplicating PD-032).
- `src/server/email/provider.ts`: `EmailProvider` interface, `ResendEmailProvider` (raw `fetch`,
  no SDK), `createEmailProviderFromEnv()`.
- `src/server/jobs/budget-thresholds.ts`: `runBudgetThresholdsJob(emailProvider)` — resolves
  which (bucket, threshold) pairs are newly due, resolves recipients (family + current org
  admins, OQ-28), sends, records only on full success (AC-02/AC-05).
- `src/app/api/jobs/budget-thresholds/route.ts`: `POST`, constant-time secret check (AC-04).
- Tests: 16 pgTAP cases (`supabase/tests/budget_threshold_notifications.test.sql`), 5 integration
  tests covering AC-01–AC-05 (`tests/integration/budget-thresholds.test.ts`), 5 unit tests for the
  Resend provider (`src/server/email/provider.test.ts`).

- Second session (2026-10-01): merged `origin/main` (clean); fixed an environment-dependent pgTAP
  assertion (FD-03); fixed the job emailing every threshold for a bucket that only has a pending
  cost (FD-04, new test T-01b written first and seen failing).
- Third session (2026-10-01): human reviewed and confirmed FD-01, FD-04 (DECISIONS.md). The
  CHG-020 pending-cost email and the threshold email's missing bucket name are split out of this
  PR per root DECISIONS.md CHG-044 — tracked as Parking lot PL-25 and PL-26 respectively
  (feature DECISIONS.md FD-05). DEVELOPMENT_PLAN.md's INT-01 card updated to match.

## In progress
- None

## Remaining
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `JOBS_SECRET` are not set anywhere — needed before this
  can send a real email or be triggered for real (DECISIONS.md FD-02). Deploy-time, not a PR blocker.
- The scheduler itself (Vercel Cron or pg_cron, OQ-17) is not configured — out of this PR's code,
  a deploy-time task.
- `supabase/seed.sql`'s batching failure under `supabase db reset` in this environment (DECISIONS.md
  FD-02) is unresolved and unrelated to this feature; flagging in case it affects others.
- PL-25 (pending-cost email) and PL-26 (threshold email bucket name) are tracked in root PRD.md
  §17 for future scheduling (DECISIONS.md FD-05) — not this PR's scope.

## Acceptance criteria status
- 5 / 5 MET

## Tests
- Second session re-run (local stack, `.env` overridden from `npx supabase status -o env`):
  `npx supabase test db` 19 files / 540 tests PASS (after FD-03; 539/540 before it);
  `vitest run tests/integration/budget-thresholds.test.ts src/server/email/provider.test.ts` 11/11;
  `npx tsc --noEmit` clean; `npm run lint` 0 errors (2 pre-existing warnings); `npm run format:check`
  clean; full `vitest run` 2469 passed / 10 failed — none in INT-01 files: 4 F0-16 seed tests (seed
  not loaded locally, FD-02), 5 other features' integration tests that pass when run alone (shared-DB
  contention in the parallel run), 1 FAM-UI-03 page test (`edit/page.test.tsx`, 'Add file' copy —
  already fixed on `main` since this branch's merge; will be picked up by the next `git merge
  origin/main` before PR).
- Written: 6 integration (T-01–T-05, T-01b), plus 16 pgTAP and 5 unit tests beyond TEST_PLAN.md's
  minimum (see TEST_PLAN.md's note on write order — not strictly red-first this session).
- Passing: all of them, run against a local Supabase stack this session —
  `npx supabase test db`: 19 files, 540 tests, PASS (includes this feature's 16);
  `vitest run tests/integration/budget-thresholds.test.ts src/server/email/provider.test.ts`: 10/10.
- Failing: none of this feature's.
- Regression: `npm run lint`, `npx tsc --noEmit`, `npx prettier --check` on every new/changed file —
  all clean. Full `npm test` against the local stack: 159 failed / 2319 passed / 2478 total — all
  pre-existing and unrelated (Next.js "cookies called outside a request scope" in unrelated
  `page.test.tsx` files, and the same date-dependent `task-detail-view.test.tsx` /
  `task-detail-view.fam15.test.tsx` failures FAM-08 already found and reproduced with its own
  changes stashed out). This feature's own files, run in isolation, are 10/10 green; grepping the
  full run's failures for "budget-threshold" or "INT-01" finds none.

## Files changed
- New: `supabase/migrations/20261001080936_budget_threshold_notifications.sql`,
  `supabase/tests/budget_threshold_notifications.test.sql`, `src/server/email/provider.ts`,
  `src/server/email/provider.test.ts`, `src/server/jobs/budget-thresholds.ts`,
  `src/app/api/jobs/budget-thresholds/route.ts`, `tests/integration/budget-thresholds.test.ts`
- No changes to `F0-12`'s migration, `src/lib/env.ts`, or any other shared file — `JOBS_SECRET`/
  `RESEND_API_KEY`/`RESEND_FROM_EMAIL` are read directly via `process.env` rather than added to
  the central `env.ts` schema, to avoid an out-of-lane touch to `src/lib/**` (Lane S) for a feature
  that doesn't otherwise need it (`docs/AGENT_REFERENCE.md`).

## Decisions
- See DECISIONS.md FD-01 (partial-recipient-failure handling; "each threshold" proposed default —
  confirmed by human), FD-02 (Resend via `fetch`; self-seeded test fixtures; the `seed.sql`
  environment issue), FD-03 (pgTAP test 9 fixed — test bug, no behaviour change), FD-04 (thresholds
  from `percent_used`, not `threshold_state` — confirmed by human), FD-05 (CHG-020 pending-cost
  email and the bucket-name gap split out of this PR — see root DECISIONS.md CHG-044)

## Problems encountered
- `supabase db reset`'s auto-seed from `supabase/seed.sql` failed twice in this environment
  (`relation "seed_users" does not exist` — a temp table apparently not surviving across the CLI's
  own batched execution). Not caused by this feature (reproduces on a clean checkout); worked
  around by seeding each test's own fixtures directly, which TEST_PLAN.md already permits.
- A Postgres column-grant subtlety: with `revoke all` and no SELECT/INSERT grant at all (rather
  than RLS alone), a signed-in user's query is refused outright (42501) instead of being silently
  filtered to zero rows — caught by running the first pgTAP draft, which expected the latter;
  fixed the test, not the migration (the loud failure is the intended behaviour here).
- ESLint's `no-restricted-imports` (ADR-02) correctly refused `createAdminClient` imported from
  the route handler (`src/app/**`); fixed by having the job create its own admin client
  internally rather than accepting one as a parameter, which also simplified the job's signature.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- Recipient resolution reads `clients.organisation_id` live at job-run time, so AC-03 needs no
  special-case logic — a transferred client's previous admin is simply never matched by the query.

## Next action
- Merged. Remaining before this runs for real: set `RESEND_API_KEY`/`RESEND_FROM_EMAIL`/
  `JOBS_SECRET` and wire up the scheduler (OQ-17).

## Ready for PR
- Merged in #190.
