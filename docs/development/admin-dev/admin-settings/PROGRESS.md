# Progress — ADM-10 Admin — Settings

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D10
Branch: `feature/admin-settings`
PR target: `main`
Last updated: 2026-09-30

## Blockers
- None. OQ-35 answered (PD-054).

## Dependencies status
- F0-07 — MERGED
- ADM-UI-05 — MERGED

## Completed
- Claimed. Docs updated (FD-01 to FD-04), AC-04 to AC-06 added
- Tests T-01 to T-09 written first

## In progress
- None

## Remaining
- Route `/admin/settings`; Organisation info card: Organisation name, ABN, Phone, Address; Reset card reused.

## Acceptance criteria status
- 0 / 6 MET (tests-first stage)

## Tests
- Written: 9 / 9 (T-01 guard green, rest red)
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(admin)/admin/settings/page.tsx`, `src/features/admin-settings/*`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implement: migration, schema, action, query supabase branch, wire screen. Then update the ADM-UI-05 tests (see TEST_PLAN).

## Ready for PR
- No
