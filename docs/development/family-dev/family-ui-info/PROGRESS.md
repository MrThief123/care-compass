# Progress — FAM-UI-04 Family Info screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D5
Branch: `feature/family-ui-info` (created from `origin/family-dev` at 02c7fa7)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None. The contracts and fixtures the screen needs (`src/server/**`, `src/mocks/**`, outside Lane F) were confirmed by the human on 2026-09-25 as CHG-018 (root DECISIONS.md), recorded in FD-02.

## Dependencies status
- F0-15 — MERGED
- UI-03 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed (`docs(family-ui-info): claim`)
- CHG-018 (contract reads + Family · Info fixtures) and FD-01/FD-02 recorded
- Tests written first (see Tests), run, and confirmed red for the right reason

## In progress
- Implementing: fixtures, mocks, contracts, then `src/features/family-info/` and the route

## Remaining
- Route `/family/[clientId]/info` inside the family layout.
- Cards for Description, Habits, Medical history and Documentation (local composition, FD-01).
- Edit toggles an inline textarea with Save/Cancel (local state; PROPOSED interaction).
- Loading skeleton, empty state and error state (States sheet) wired to the query contract's states.
- Data only via `src/server/**` contract functions (mock data source).
- Real-browser width sweep 1920 to 768 and the side-by-side screenshot against `family-04-info.png` for the PR.

## Acceptance criteria status
- 0 / 3 MET (tests written and red; implementation not started)

## Tests
- Written: 3 / 3 acceptance criteria, plus the PRD cases (states, edit behaviour, wrapping, a11y, contracts)
- Passing: 0 new (the 1 test in `document-tile.test.tsx` that checks unchanged behaviour passes already)
- Failing: 17 tests plus 2 test files that cannot load yet, all for the expected reason:
  - `getClientInfoSections` / `getClientDocuments` are not exported (`is not a function`)
  - `CLIENT_INFO_SECTIONS` is not exported from `@/mocks/fixtures`
  - `./info-data` and the route's `loading` do not exist yet
  - `DocumentTile` reads `mimeType` on a name-only document (`Cannot read properties of undefined (reading 'trim')`)
- Files: `src/features/family-info/family-info.test.tsx`, `src/features/family-info/info-data.test.ts`, `src/server/clients/queries.test.ts`, `src/mocks/queries/clients.test.ts`, additions to `src/server/documents/queries.test.ts` and `src/features/family-task-detail/document-tile.test.tsx` (additive; no existing test changed)

## Files changed
- Docs: root `DECISIONS.md` (CHG-018), this feature's `DECISIONS.md` (FD-01, FD-02), PROGRESS.md
- Tests: as listed above
- Likely to change: `src/mocks/fixtures.ts`, `src/mocks/queries/{clients,documents}.ts`, `src/server/{clients,documents}/queries.ts`, `src/features/family-task-detail/document-tile.tsx` (prop type widened), new `src/features/family-info/*`, `src/app/(family)/family/[clientId]/info/{page,loading}.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- I told the human the renamed fixture "Care plan 2026.pdf" had only a schema check as its consumer. That was wrong: the name also appears in a carer notification fixture (`notif-aisha-2`) and as an unrelated test's own literal. Corrected in-session; the notification is left as its design draws it (CHG-018 Impact, FD-02).

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- OQ-38 and OQ-26 are non-blocking; their proposed defaults are used.

## Next action
- Implement the minimum to turn the tests green, then run the local checks and the browser check.

## Ready for PR
- No
