# Progress — FAM-01 Family Home — Today day-view timeline

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D8
Branch: `feature/family-home-today`
PR target: `main`
Last updated: 2026-10-01 (claimed)

## Blockers
- None. OQ-29 is answered (PD-055, 2026-09-17).

## Dependencies status
- F0-11 — MERGED
- F0-16 — MERGED
- FAM-UI-01 — MERGED
- F0-22 (client header wiring and family route guard, added by CHG-042) — MERGED, PR #181

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/family/[clientId]/home` page shell with left Today panel region (right column and budget strip are FAM-02/FAM-03).
- Card title 'Today' and right-aligned caption 'Mon 30 Nov · day view'.
- Hour gutter 07:00–18:00, 44px rows; past hours shown in text/muted per design.
- Event blocks positioned by start time and sized by duration with #0C9BA9 left stripe, title (Body/Emphasis), carer name (e.g. 'Aisha R.'), duration ('1 hr', '1 hr 30 min'), status pill at right.
- Empty state when no events today (EmptyState primitive; copy PROPOSED 'Nothing scheduled today').
- Loading skeleton and ErrorState with Retry.

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 6 / 6 ACs, plus T-07 and T-08 (17 tests in 3 files)
- Passing on first run: 6 (regression guards for work FAM-UI-01 and F0-22 already did: T-01, T-02, T-03, T-04, T-06, and the integration redirect check)
- Failing for the right reason: 11 (5 unit and 3 integration: `getTodayOccurrences` is "not implemented" under Supabase; 3 page tests: the page does not call `assertClientAccess`)

## Tests written first
- Commands: `npx vitest run src/server/events/get-today-occurrences.test.ts "src/app/(family)/family/[clientId]/home"` (13 tests: 8 fail, 5 pass); integration with the local Supabase env (`supabase status -o env`): `npx vitest run tests/integration/family-home-today.test.ts` (4 tests: 3 fail, 1 passes). `npm run typecheck` clean; `npm run lint` 0 errors (2 existing warnings in `dev-preview/page.tsx`).
- To implement: Supabase branch of `getTodayOccurrences` in `src/server/events/queries.ts` (today via `getToday()`, `loadOccurrences` over `melbourneDaysToInstants`, same `type` handling as `getOccurrences`); `home/page.tsx` calls `assertClientAccess(clientId)` first, outside the try/catch (FD-05).

## Files changed
- Tests: `src/server/events/get-today-occurrences.test.ts`, `src/app/(family)/family/[clientId]/home/page.test.tsx`, `tests/integration/family-home-today.test.ts`. Likely production files: `src/app/(family)/family/[clientId]/home/page.tsx`, `src/features/family-home/today-panel.tsx`, `src/features/family-home/position-blocks.ts`, `src/features/family-home/*.test.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implementation session (fresh context): make the failing tests pass, then run the suite and the visual check.

## Ready for PR
- No
