# Progress — FAM-14 Family — Task log

Status: MERGED TO DEV
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D11
Branch: `feature/family-task-log`
PR target: `family-dev`
Last updated: 2026-09-28

**HUMAN REVIEW requested (FD-02):** `shared-plain-events` DECISIONS.md FD-01 names FAM-14 as an
adopter of `type: "all"` (showing plain events alongside tasks in the log), but none of FAM-14's
own ACs mention it and adopting it is real, unbuilt UI work (`TaskLogTable`/`TaskLogView` are
typed and built for tasks only). Not implemented in this branch — flagged for the human to decide
whether it is a follow-up feature/CHG or should be folded in before merge. See DECISIONS.md FD-02.

## Blockers
- None — OQ-29 is ANSWERED (root DECISIONS.md).

## Dependencies status
- F0-11 — MERGED TO DEV
- FAM-UI-07 — MERGED TO DEV

## Completed
- Traced the gap: FAM-UI-07 already built the route, loader, search/filter/pagination and table
  against the real `getTaskLog` contract (not fixtures), and FAM-02 already gave `getTaskLog` its
  Supabase branch (search, status, pagination, range) for the Home cards. 'View all' links from
  Home Recent activity and the Calendar's Log panel already point at the Task log route. FAM-14's
  scoped wiring gap did not exist by the time this session started.
- Added `[FAM-14][AC-01..04]` component tests re-proving the route's behaviour against the real
  mock contract under this feature's own AC IDs (coverage mapping rule, TESTING.md).
- Added a new integration suite (`tests/integration/family-task-log.test.ts`) proving AC-05
  against real Supabase: a perpetual weekly event never returns an occurrence past today, plus
  an RLS negative case.
- Ran the existing Task log Playwright e2e suites (14/14 pass) to confirm no regression.
- Recorded two decisions: AC-01's listed order is illustrative, not CHG-005's tie-break (FD-01);
  the shared-plain-events `type: "all"` adoption is flagged, not implemented (FD-02, HUMAN REVIEW).

## In progress
- None

## Remaining
- None in FAM-14's scope as documented (pending the HUMAN REVIEW above on FD-02).

## Acceptance criteria status
- 5 / 5 MET

## Tests
- Written: 6 (T-01–T-05 plus one RLS integration case)
- Passing: all (`npx vitest run`, `tests/integration/family-task-log.test.ts` with local Supabase
  env, `npm run typecheck`, `npm run lint`, and the Task log Playwright e2e specs also green)
- Failing: 0

## Files changed
- `src/app/(family)/family/[clientId]/tasks/page.test.tsx` — FAM-14 component tests
- `tests/integration/family-task-log.test.ts` — new, FAM-14 integration suite

## Decisions
- See DECISIONS.md (FD-01 — AC-01 order reading, FD-02 — HUMAN REVIEW requested)

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human reviews FD-02 (plain-events adoption); then open the PR to `family-dev` once CI is green
  (human authorises PR creation per DEVELOPMENT_WORKFLOW.md §7).

## Ready for PR
- Yes, pending FD-02 review.

## Merged — 2026-09-28
- PR #139 (https://github.com/MrThief123/care-compass/pull/139) merged to `main`. Status set to MERGED TO DEV in a docs sync, since the merge left it at READY FOR PR.
