# Progress — INT-04 End-to-end: admin rostering journey

Status: MERGED TO DEV (merged to `main` in #196, 2026-10-01)
Owner: MrThief123
Lane: I — Integration
Sprint: SPRINT · planned D12
Branch: `feature/admin-assign-shift-e2e` (from `main`)
PR target: `main` (CHG-036)
Last updated: 2026-10-02

## Blockers
- None. OQ-09 and OQ-33 ANSWERED in root DECISIONS.md.

## Dependencies status
- ADM-07 — MERGED (#193)
- CAR-02 — MERGED (#174)
- CAR-05 — MERGED
- FAM-01 — MERGED

## Completed
- Claimed; spec `tests/e2e/admin-rostering.spec.ts` written from TEST_PLAN.md (T-01, T-02) plus two `[PRD]` checks (T-03 family REQ-26, T-04 overlap edge case; FD-03).
- All four pass against a real local Supabase stack. No production code, migration or shared helper changed; no integration gap found (FD-01).

## In progress
- Nothing.

## Remaining
- None. Not run in CI (e2e is skipped on `main`); results above are from the local stack.

## Acceptance criteria status
- 2 / 2 MET

## Tests
- Written: 4 / 4 (T-01 to T-04). Passing: 4. Failing: 0.
- Tests-first: written before running against merged code; first run T-01 green, T-02 red on the spec's own selector (range label is text, not a heading), fixed in the spec (FD-01).
- Commands and results (2026-10-01, local stack `care-compass` on 127.0.0.1:54321, migrations identical to `main`; the three Supabase env vars from `supabase status -o env`, never the hosted project):
  - `next build` with the local env: OK.
  - `E2E_PORT=3140 E2E_DATA_SOURCE=supabase npx playwright test tests/e2e/admin-rostering.spec.ts`: 4 passed.
  - Same env, `admin-rostering.spec.ts admin-assign-shift.spec.ts carer-care-delivery.spec.ts --repeat-each 3`: 24 passed, no flakes. Afterwards no `int-04-*` users or organisations left in the database.
  - `npm run lint`: 0 errors (2 warnings in `src/app/dev-preview/page.tsx`, not this feature). `npx tsc --noEmit`: clean. `npx prettier --check tests/e2e/admin-rostering.spec.ts`: clean.
- Not run: full unit suite / `supabase test db` (TEST_PLAN regression scope): this feature changes only an e2e spec and docs. Run before the PR if the human wants the full suite.

## Files changed
- `tests/e2e/admin-rostering.spec.ts` (new)
- Docs in this folder.

## Decisions
- See DECISIONS.md (FD-01 to FD-04). Notable: notification text carries the full client name per CHG-032 (FD-02), AC-01's '(Margaret)' wording left as is.

## Problems encountered
- None in product code. Port 3000 and 3121 were in use by other worktrees; used 3140.

## Assumptions
- None beyond FD-01 to FD-04.

## Next action
- None.

## Ready for PR
- Done: merged in #196.
