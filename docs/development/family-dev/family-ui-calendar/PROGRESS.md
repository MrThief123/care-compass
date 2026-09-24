# Progress — FAM-UI-02 Family Calendar screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D4–D5
Branch: `feature/family-ui-calendar-ticks` (CHG-016 follow-up, created from `origin/family-dev` at d7ccf71). The original build, `feature/family-ui-calendar`, was merged to `family-dev` (#77).
PR target: `family-dev`
Last updated: 2026-09-24

**CHG-016 (2026-09-24), in progress:** a tick in the Tasks panel shows on the week, day and month grids on the same page ("Done · <signed-in name>"); display only, nothing saved (FAM-05 wires `setOccurrenceDone`).

## Blockers
- None.

## Dependencies status
- F0-15 — MERGED
- UI-01 — MERGED
- UI-03 — MERGED

## Completed
- Contract gap found and closed under root **CHG-012** (human-approved, made on this branch, FD-01). Added `getOccurrences(clientId, { from, to })` and `getToday()` to the events contract, with mocks, `OccurrenceRangeSchema`, and the Tue 1 – Sat 5 Dec design rows, which are kept out of the Task log (FD-02).
- Route `/family/[clientId]/calendar`, with `loading.tsx` (skeleton) and `error.tsx` (ErrorState + retry).
- D/W/M through `?view=&date=&month=` (FD-03), a local toolbar with a range heading and Previous/Next (FD-04), and `WeekGrid` / `DayTimeline` / `MonthGrid` from the kit.
- Tasks panel: 'Tasks', the selected-date subtitle, `TaskChecklist` with local ticks (a Done task starts ticked; OQ-10 default).
- Log panel: 'Log', 'View all' → Task log, three `ActivityLinkRow`s (FD-05).
- Empty states: "No tasks on this day", "No activity yet".
- CHG-013 (human request, 2026-09-24): D/W/M and ←/→ keyboard shortcuts, and a Today button (T) beside the range heading (FD-12).
- Real-browser check (Playwright, production build) at 1920, 1440, 1024 and 768 px, against `docs/design/screens/family-02-calendar.png`. Fixed a stray current-time label (FD-07) and the checkbox colour and spacing.

## In progress
- None

## Remaining
- Review and merge of PR #77 (human). Side-by-side screenshot to be attached to the PR by hand.

## Acceptance criteria status
- 7 / 7 MET (AC-06, AC-07 added by CHG-013)

## Tests
- Written first: T-01 to T-05 plus 60 more (see TEST_PLAN.md "Additional tests"). All failed before implementation for the right reason: missing modules/functions.
- Passing: `src/features/family-calendar` 65/65, `src/server/events/occurrences.test.ts` 17/17, `tests/e2e/family-calendar.spec.ts` 7/7 (run on `next dev` at localhost:3100, since a production server was already on 3000).
- Suite: `vitest run src tests/unit` passes 989/989. Lint has 0 errors (3 old warnings in other files). Typecheck and Prettier are clean.
- Not green, environment only: `tests/integration/shared-authentication.test.ts` and `shared-supabase-environment.test.ts` (5 tests), plus e2e `auth.spec.ts` (2 tests). They need the local Supabase stack, and Docker is not installed on this machine ("Invalid API key"). `supabase test db` could not run for the same reason. This feature touches no auth or database code.

## Files changed
- `src/app/(family)/family/[clientId]/calendar/{page,loading,error}.tsx`
- `src/features/family-calendar/*` (view, toolbar, panels, params, format, loader, skeleton, tests)
- Shared (CHG-012): `src/server/events/queries.ts`, `src/server/events/occurrences.test.ts`, `src/mocks/queries/events.ts`, `src/mocks/fixtures.ts`, `src/types/domain.ts`
- `tests/e2e/family-calendar.spec.ts`
- `DECISIONS.md` (CHG-012), feature docs

## Decisions
- See DECISIONS.md FD-01 to FD-12. HUMAN REVIEW: FD-01 (shared folders edited from a family branch, approved), FD-08 (M-month rule), FD-09 (block click → Task detail; answered 2026-09-24: keep).
- CHG numbering: recorded as CHG-006 and CHG-007 on this branch; renumbered to CHG-012 and CHG-013 when merging `family-dev` (2026-09-24), where CHG-006 to CHG-011 were taken. `feature/admin-ui-home` still records a CHG-006 and renumbers when it merges.

## Problems encountered
- The events contract had no range read (CHG-012).
- History rewrite and a bulk rename to renumber CHG-006 were blocked by the session's permission policy, so the number stayed CHG-006 for the human to settle. Settled when merging `family-dev`: now CHG-012 (and CHG-007 is CHG-013). Commit messages before the merge still say CHG-006 and CHG-007.
- Merging `family-dev` after the #84 sync (2026-09-24) conflicted in root `DECISIONS.md`, `src/mocks/fixtures.ts`, `src/mocks/queries/events.ts` and `src/server/events/queries.ts`. Kept both sides: `getEvent` (CHG-008) and plain events (CHG-009) beside `getToday` and `getOccurrences`. Mock `getOccurrence` keeps the `type` option and still finds upcoming task rows for task searches. `getOccurrences` returns tasks only; plain events on the calendar are follow-up work.

## Assumptions
- The design's "Aisha R." pill is shown as the full name (PD-038), as on Home.

## Next action
- Human: review and merge PR #77 into `family-dev`.
- Follow-up, not in this PR: (1) Task detail: a clearer "Edit event" button, and Back returns to where the task was opened from (CHG-014, FD-09). (2) `getOccurrences` returns tasks only, so plain events (CHG-009) do not show on the calendar yet.

## Ready for PR
- Yes. PR #77 open.
