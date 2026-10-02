# Progress — INT-11 Email Family and admins when an event cost goes pending

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: B — Backend
Sprint: SPRINT · planned D19 (proposed)
Branch: `feature/shared-pending-cost-email`
PR target: `main` (CHG-036)
Last updated: 2026-10-02

## Blockers
- Human approval of the pack and of the proposed CHG (DECISIONS.md). No open blocking OQ.

## Dependencies status
- INT-01 — MERGED (#190)
- F0-12, F0-11 — MERGED
- INT-10 — READY FOR PR on `feature/shared-budget-threshold-email-bucket-name` (edits `budget-thresholds.ts` only; no overlap)

## Completed
- Doc pack drafted from the human's 2026-10-02 decisions.

## Acceptance criteria status
- 0 / 8 MET (proposed)

## Tests
- Written first (2026-10-02): integration `tests/integration/pending-cost-emails.test.ts` (T-01..T-07, T-09; T-02 and T-02b), route test `src/app/api/jobs/pending-cost-emails/route.test.ts`, pgTAP `supabase/tests/budget_pending_cost_notifications.test.sql`.
- Red run before implementation: vitest fails with 'Failed to resolve import' for the missing job and route modules; `supabase test db` fails the new pgTAP file (table and function do not exist yet). Right reason: nothing implemented.

## Files changed
- This doc pack only.

## Decisions
- FD-01 to FD-09, proposed CHG text (PROPOSED)

## Next action
- Human reviews the pack, confirms FD-03, FD-07, FD-09 and the CHG; then claim, promote to INT-11 (CHG, plan row and card, PRD §17 mark, status page) and write tests first.

## Ready for PR
- No
