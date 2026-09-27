# Progress — F0-17 Self-serve sign-up for Family and Organisation accounts

Status: IN PROGRESS
Owner: MrThief123
Lane: B — Backend
Branch: `feature/shared-sign-up`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-27

## Blockers
- None — OQ-01, OQ-07, OQ-08 ANSWERED

## Dependencies status
- F0-06 — MERGED TO DEV
- F0-07 — MERGED TO DEV

## Completed
- Feature documentation drafted (CHG-010, 2026-09-24)

## In progress
- None

## Remaining
- Migration, `signUp` action, `/sign-up` page, sign-in link; e2e run against a build

## Acceptance criteria status
- 0 / 8 MET

## Tests
- Written: 8 / 8 (T-01 to T-08), plus extra PRD tests (signed-in redirect, no direct inserts, discard of a half-made account)
- Passing: 0
- Failing: all, for the expected reason (2026-09-27): pgTAP `register_account` / `discard_unregistered_account` do not exist; integration `signUp` is not exported; e2e `/sign-up` not built (not run red: needs `npm run build`)

## Files changed
- `supabase/tests/sign_up.test.sql`, `tests/integration/shared-sign-up.test.ts`, `tests/e2e/sign-up.spec.ts`

## Decisions
- PD-057, CHG-010 (root DECISIONS.md)

## Problems encountered
- None

## Assumptions
- PROPOSED copy in PRD.md is unconfirmed until reviewed in the PR.

## Next action
- Implement: migration (`register_account`, `discard_unregistered_account`), `signUp` action, `/sign-up` page and the sign-in link; run until green.

## Ready for PR
- No
