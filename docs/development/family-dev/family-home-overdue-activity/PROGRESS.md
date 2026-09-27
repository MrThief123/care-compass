# Progress — FAM-02 Family Home — Overdue card and Recent activity

Status: READY FOR PR
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D8
Branch: `feature/family-home-overdue-activity`
PR target: `family-dev`
Last updated: 2026-09-27

## Blockers
- None

## Dependencies status
- F0-11 — MERGED TO DEV
- FAM-UI-01 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Found the Overdue card, Recent activity card and their routing already built by FAM-UI-01 (fixture/`DATA_SOURCE=mock`-backed), including badge, empty state, pill+icon rows and "View all"/row links to the real `/family/<clientId>/tasks[...]` routes.
- Corrected the Overdue empty-state body to AC-02's controlled wording, "There are no overdue tasks right now." (FD-01; FAM-UI-01 had shipped different copy flagged as an unreviewed design gap under OQ-24).
- Added the Supabase branch of `getTaskLog` (`src/server/events/queries.ts`), the actual remaining wiring gap: reuses `loadOccurrences`/`buildOccurrences` (F0-11) and the mock's own pure `queryTaskLog` for filtering/ordering/paging/`total`, so both data sources answer identically (FD-02).
- `getTodayOccurrences` left `notImplementedForSupabase`: it is FAM-01's Today timeline, out of FAM-02's scope, not something Overdue/Recent activity call.
- Wrote FAM-02-labelled component tests (T-01, T-02, T-04) and an integration suite against local Supabase (T-03), confirmed red before the `getTaskLog` change, green after.
- Manually verified `/family/client-margaret/home` (DATA_SOURCE=mock): Recent activity renders 5 items, newest first (Mon 30 Nov, Sun 29 Nov ×2, Sat 28 Nov ×2), Overdue pills carry the warning icon, links resolve.

## In progress
- None

## Remaining
- None in FAM-02's scope. `getTodayOccurrences`'s Supabase branch is FAM-01's to add.

## Acceptance criteria status
- 4 / 4 MET

## Tests
- Written: 7 (T-01–T-04 plus 3 supporting integration cases: Overdue total, tick-off-to-Done, RLS negative)
- Passing: all (component suite: `npx vitest run src/features/family-home` — 134/134; integration: `npm run test:integration` with local Supabase env — 4/4 new, no regressions in existing integration suite)
- Failing: 0

## Files changed
- `src/server/events/queries.ts` — `getTaskLog` Supabase branch, `TASK_LOG_EARLIEST_DATE`
- `src/features/family-home/overdue-card.tsx` — empty-state copy fix (FD-01)
- `src/features/family-home/activity-cards.test.tsx` — FAM-02 component tests
- `tests/integration/family-home-overdue-activity.test.ts` — new, FAM-02 integration suite

## Decisions
- See DECISIONS.md (FD-01, FD-02)

## Problems encountered
- FAM-UI-01 had already built the cards' UI and routing (Phase 1, on the mock data source) beyond a typical fixture screen, including real-looking data composition (`home-data.ts`). The actual FAM-02 gap was narrower than the PRD implied: only `getTaskLog`'s Supabase implementation, plus one copy correction.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- OQ-31 (Task log range) stays OPEN; its non-blocking proposed default ("up to end of today") is applied, with the lower bound decided as FD-02.

## Next action
- Open the PR to `family-dev` once CI is green (human authorises PR creation per DEVELOPMENT_WORKFLOW.md §7).

## Ready for PR
- Yes
