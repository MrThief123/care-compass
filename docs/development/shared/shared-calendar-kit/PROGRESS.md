# Progress — UI-01 Calendar kit: week/day/month grids, event blocks, date picker

Status: READY FOR PR
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D3
Branch: `feature/shared-calendar-kit`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-18 (implementation complete)

## Blockers
- None

## Dependencies status
- F0-14 — MERGED TO DEV
- UI-00 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Pure helpers `src/lib/dates/`: `weekRange(date)`, `monthGrid(date)`, `positionBlocks(occurrences, {startHour, rowPx})`.
- `DayTimeline` (hour gutter 07:00–18:00, blocks with #0C9BA9 left stripe, title, assignee, duration, status pill).
- `WeekGrid` (MON–SUN headers with day number, today column highlighted, hour gutter, blocks showing time + title; `labelFormat` prop override).
- `MonthGrid` (cell states default/today/selected/has-events/out-of-month).
- `CalendarHeader` (range label, prev/next, D/W/M segmented control reusing F0-14's `SegmentedControl`, default W).
- `DatePickerGrid` (month label with chevrons, MON–SUN, dots for days with items, selected filled circle, out-of-month muted).
- Component tests for each state; axe checks (all six components, zero violations).

## In progress
- None

## Remaining
- None (in-scope)

## Acceptance criteria status
- 6 / 6 MET

## Tests
- Written: 6 / 6 mapped (T-01..T-06), plus additional state/edge-case tests per component (16 test files total, 26 test cases)
- Passing: all (`npm run test` — 122 passed / 1 pre-existing unrelated failure, see Problems encountered)
- Failing: 0 in this feature's files

## Files changed
- `src/lib/dates/week-range.ts` (+ test), `src/lib/dates/month-grid.ts` (+ test), `src/lib/dates/position-blocks.ts` (+ test)
- `src/components/shared/calendar/day-timeline.tsx` (+ test), `week-grid.tsx` (+ test), `month-grid.tsx` (+ test), `calendar-header.tsx` (+ test), `date-picker-grid.tsx` (+ test), `melbourne-time.ts` (internal helper), `calendar.axe.test.tsx`

## Decisions
- See DECISIONS.md — no new feature-level decisions recorded; OQ-32 (Melbourne timezone) and OQ-33 (carer calendar semantics) proposed defaults applied where relevant (Melbourne-timezone date extraction; `labelFormat` prop left open for carer-specific composition rather than baked in).

## Problems encountered
- `npm install` was needed locally to pick up F0-04's `@supabase/*` dependencies before `tsc --noEmit` would run clean; unrelated to this feature.
- `tests/integration/shared-supabase-environment.test.ts` (F0-04, pre-existing) fails without a running local Supabase instance (`supabase start`) — not touched by this feature, not part of its scope per AGENT_REFERENCE.md's "Kit component" test minimum.
- Initial `WeekGrid`/`MonthGrid` day-header buttons used `role="columnheader"`, which axe flagged (`aria-required-parent`) since they weren't inside a `role="row"`/`role="grid"` structure. Switched to `data-testid` + `aria-current`/`aria-pressed` instead of adding full ARIA table semantics, since the kit doesn't otherwise need grid/table roles.

## Assumptions
- PROPOSED items in PRD.md (extending the gutter for events outside 07:00–18:00; overlapping blocks side by side) are not yet implemented — out of the ACs tested here, left for a screen feature to request if needed.
- `TEST_PLAN.md`'s "Regression scope" (`supabase test db`, Playwright) doesn't apply to a kit-component feature with no schema and no e2e AC — see AGENT_REFERENCE.md's "Minimum tests by feature type" table; ran `npm run verify` instead.

## Next action
- Announce readiness to the human and wait for approval before opening the PR to `main`.

## Ready for PR
- Yes
