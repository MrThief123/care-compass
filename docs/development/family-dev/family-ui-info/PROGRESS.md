# Progress — FAM-UI-04 Family Info screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D5
Branch: `feature/family-ui-info` (created from `origin/family-dev` at 02c7fa7)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- Waiting on a human answer: the screen needs a client-info contract read, a client-documents contract read and design fixtures, all in folders Lane F does not own (`src/server/**`, `src/mocks/**`). No code is written until that is answered (CLAUDE.md §4.2, §10).

## Dependencies status
- F0-15 — MERGED
- UI-03 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- Claimed; inspecting kit, contracts and fixtures against the design

## Remaining
- Route `/family/[clientId]/info` inside the family layout.
- `ClientInfoView` with canEdit=true.
- Edit toggles an inline textarea with Save/Cancel (local state; PROPOSED interaction).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/app/(family)/family/[clientId]/info/page.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- complete dependencies, run START FEATURE FAM-UI-04, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
