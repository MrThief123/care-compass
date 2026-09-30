# Progress — F0-16 Development seed data from the design content

Status: IN PROGRESS
Owner: Prajeet
Lane: B — Backend
Sprint: SPRINT · planned D7
Branch: `feature/shared-dev-seed-data` (created from main 2026-09-30)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-30

## Blockers
- None. OQ-01 answered (2026-09-17); F0-10, F0-11, F0-12, F0-13 merged. FD-01 to FD-05 in DECISIONS.md; FD-02 and FD-05 await human confirmation.

## Dependencies status
- F0-10, F0-11, F0-12, F0-13 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed 2026-09-30; tests written first and run: all 6 failed for the expected reason (no seed data, no script)
- `supabase/seed.sql`, `scripts/seed.mjs`, `npm run db:seed`, `docs/SEED_DATA.md`
- Two consecutive `supabase db reset` runs give identical data

## In progress
- Awaiting human review of FD-02 / FD-05 and the PR

## Remaining
- Playwright e2e for this feature not run (no UI change; seed only)
- Human approval before the PR is opened

## Acceptance criteria status
- 3 / 3 MET

## Tests
- Written: 3 / 3 (6 integration tests: T-01 x2, T-02, T-03 x2 plus the seed content test)
- Passing: 6 / 6. `supabase test db`: 14 files, 446 tests pass. `npm run verify`: lint 0 errors (3 existing warnings), typecheck, format, 2186 Vitest tests pass.
- Failing: 0

## Files changed
- `supabase/seed.sql`, `scripts/seed.mjs`, `package.json` (`db:seed`), `tests/integration/shared-dev-seed-data.test.ts`, `docs/SEED_DATA.md`, this folder's docs, F0-16 cards in `docs/JIRA_TICKETS.md` and `docs/JIRA_BACKLOG.csv` (Helen's email)

## Decisions
- See DECISIONS.md (FD-01 to FD-05)

## Problems encountered
- Helen's PRD email clashed with 8 pgTAP files; resolved by FD-01 (human answered). Second organisation renamed Kookaburra Care to avoid sign_up test 21.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human reviews FD-02 / FD-05; on approval, merge latest `main`, re-run the suites, push and open the PR to `main`.

## Ready for PR
- Yes, pending human approval
