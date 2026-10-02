# Progress — INT-11 Email Family and admins when an event cost goes pending

Status: READY FOR PR
Owner: Dhruv Verma
Lane: B — Backend
Sprint: SPRINT · planned D19
Branch: `feature/shared-pending-cost-email`
PR target: `main` (CHG-036)
Last updated: 2026-10-02

## Blockers
- None. Human approval is needed before the PR is opened.

## Dependencies status
- INT-01, F0-11, F0-12 — MERGED
- INT-10 and FAM-16 are on other unmerged branches; this branch does not include them (totals and next-number lines in DEVELOPMENT_PLAN.md and the CHG number will conflict with them at merge).

## Completed
- CHG-052 recorded (final), PL-25 promoted: DEVELOPMENT_PLAN.md row, card, totals (91 features, 437 criteria), next number INT-12; PRD.md section 17; status page refreshed.
- Tests first, red, then migration `20261002073527_pending_cost_notifications.sql`, `src/server/jobs/pending-cost-emails.ts`, `src/app/api/jobs/pending-cost-emails/route.ts`, second `vercel.json` cron, regenerated `database.types.ts`.

## Acceptance criteria status
- 8 / 8 MET (AC-08: INT-01 and F0-12 tests pass; one INT-01 assertion changed, see HUMAN REVIEW)

## HUMAN REVIEW
- Test expectation changed: `src/app/api/jobs/budget-thresholds/route.test.ts` cron assertion, from exactly one entry to INT-01's entry present (DECISIONS FD-12, CHG-052).

## Tests
- Written first (2026-10-02): integration `tests/integration/pending-cost-emails.test.ts` (T-01..T-07, T-09; T-02 and T-02b), route test `src/app/api/jobs/pending-cost-emails/route.test.ts`, pgTAP `supabase/tests/budget_pending_cost_notifications.test.sql`.
- Red run before implementation: vitest fails with 'Failed to resolve import' for the missing job and route modules; `supabase test db` fails the new pgTAP file (table and function do not exist yet). Right reason: nothing implemented.

## Checks run locally (CI is down; no workflow runs triggered)
Local Supabase stack, URL/keys from `npx supabase status -o env`, `DATA_SOURCE=mock` for the full run.
- `npm run lint`: 0 errors, 3 warnings (import/order in `scripts/status-page.mjs` and `src/app/dev-preview/page.tsx`, not touched here)
- `npm run typecheck`: pass
- `npx prettier --check .`: pass
- `npx vitest run tests/integration/pending-cost-emails.test.ts tests/integration/budget-thresholds.test.ts src/app/api/jobs`: 27 passed
- `npx vitest run` (full): 2635 passed, 9 failed, 12 skipped. The 9 failures are PRE-EXISTING on `main` (same 9 when those five files are run in the main checkout): storage upload `42P10` on the local stack (F0-13, F0-21, F0-23, CAR-04) and F0-16 seed data absent locally
- `npx supabase test db`: pass (24 files, 724 tests, includes the new pgTAP file)
- `DATA_SOURCE=mock npm run build`: pass
- `node scripts/status-page.mjs` run; page opened in a real browser at 390 px: no console errors, no horizontal overflow
- No e2e (no UI); no workflow runs triggered

## Files changed
- `supabase/migrations/20261002073527_pending_cost_notifications.sql`, `src/server/jobs/pending-cost-emails.ts`, `src/app/api/jobs/pending-cost-emails/route.ts`, `vercel.json`, `src/lib/supabase/database.types.ts`
- Tests: `tests/integration/pending-cost-emails.test.ts`, `src/app/api/jobs/pending-cost-emails/route.test.ts`, `supabase/tests/budget_pending_cost_notifications.test.sql`; one assertion in `src/app/api/jobs/budget-thresholds/route.test.ts`
- Docs: this pack, `DECISIONS.md` (CHG-052), `DEVELOPMENT_PLAN.md`, `PRD.md`, `care-compass-status.html`

## Decisions
- FD-01 to FD-14 (all final); CHG-052 confirmed.

## Next action
- Human approves; open the PR to `main`.

## Ready for PR
- Yes, pending human approval
