# Progress — FAM-UI-03 Family Add / Edit event screens (UI)

Status: MERGED TO DEV
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D5
Branch: `feature/family-ui-event-form-origin` (CHG-015 follow-up, created from `origin/family-dev` at d7ccf71). The original build, `feature/family-ui-event-form`, was merged to `family-dev` in PR #79 on 2026-09-24.
PR target: `family-dev`
Last updated: 2026-09-24

**CHG-017 (2026-09-24): READY FOR PR** (built on `feature/family-ui-calendar-add-event` with FAM-UI-02; PR to `family-dev`). Add event opened from the Calendar (`from=calendar` plus its view) returns there on Save event and Cancel; any other origin still goes Home. New AC-10 (MET), T-10 (PASS), FD-11. Files: `src/features/family-event-form/event-form-return.ts`, `src/app/(family)/family/[clientId]/events/new/page.tsx`, tests. Red first: 2977ff8. Checks: see FAM-UI-02 PROGRESS.md (CHG-017).

**CHG-015 (2026-09-24): MERGED TO DEV** (#86 to `family-dev`). Task detail's "Edit event" link carries `?occurrence=<key>` and Task detail's own origin, so the form opens on the occurrence being viewed. On Edit event, Save event and Cancel go to that occurrence's Task detail with the origin kept (Back from there still reaches the Calendar / Home / Task log view it started on); with no valid occurrence, to the origin screen; with no origin, the Task log. Add event's go to Home. Built only from whitelisted, re-validated values; `router.back()` is gone (FD-09). New AC-07 to AC-09 (MET), T-07 to T-09 (PASS). Closes FAM-UI-07 FD-29. Files: `src/features/family-event-form/{event-form-return.ts (new), event-form-screen.tsx}`, `src/app/(family)/family/[clientId]/events/{[eventId]/edit/page.tsx, new/page.tsx}`, `src/features/family-task-detail/{task-detail-origin.ts, task-detail-view.tsx}`, `src/features/family-task-log/task-routes.ts` (exports `taskLogQuery`).
- Red first: c00ee68 (`event-form-return.test.ts` failed to load, module absent; 11 tests failed for the expected reasons: `router.push` not called, hrefs without `occurrence` / origin). The new e2e tests were not run red (a production build per run); green: b451d3f.
- Checks (2026-09-24, local; CI is off): `npx tsc --noEmit` clean; `npx eslint .` 0 errors, the 3 known warnings in other files; `npx prettier --check .` only `.claude/settings.json`; `npx vitest run src tests/unit` 100 files / 1,160 tests pass (1,144 + 16 new); `npx next build`, then Playwright on `npm run start`: 31 of 32 pass (`family-event-form` 6, `family-task-detail-nav` 11, `family-calendar` 7, `family-task-log-filters` 3, `shared-app-shell` 4 of 5).
- **Pre-existing failure, not this branch:** `shared-app-shell.spec.ts` `[F0-15][PRD] keeps header text inside the header bar… at 480px wide` fails with 30px page overflow (once 172px). It fails the same way on a clean production build of `origin/family-dev` (d7ccf71), 3 of 3 runs, so it is not caused by CHG-015. Lane S's spec and shell; not touched here. It passed in the CHG-014 run earlier today; the header shows today's date, so it may depend on the date string's length (not investigated).
- Browser check (production server, Chromium): Task detail (from the Calendar month view) → Edit event opens on Saturday 28 November 2026, Done → Cancel returns to that Task detail with `from=calendar&view=month&date=2026-11-28&month=2026-11` → Back to Calendar returns to the month. Width sweep 1920/1440/1280/1024/768 on Task detail, Edit event and Add event: horizontal scroll 0, no overlapping controls, no console errors.
- **HUMAN REVIEW: test expectation changed (FD-10):** 6 items; `router.back` assertions became `router.push` to the validated href, and Task detail's Edit event hrefs gained the occurrence and origin. No test skipped, `.only`-ed or deleted.

## Blockers
- None.

## Dependencies status
- F0-15 — MERGED
- UI-02 — MERGED
- UI-01 — MERGED
- UI-03 — MERGED

## Completed
- Contract gap closed under root **CHG-008** (human-approved in-session): `getEvent(clientId, eventId)` in `src/server/events/queries.ts`, with its mock (FD-01).
- Route `/family/[clientId]/events/[eventId]/edit`, prefilled from `getEvent` plus the occurrence (`?occurrence=`, else today's, else the anchor date); unknown or foreign ids are a 404.
- Route `/family/[clientId]/events/new`, an empty form titled 'Add event' (PROPOSED, FD-02).
- Documents: 'Physio referral.pdf', 'Exercise plan.pdf' and a dashed 'Add file' tile that uploads nothing (FD-03).
- Save event validates, then goes Back; Cancel goes Back; nothing persists (FD-04).
- `loading.tsx`, `error.tsx` and `not-found.tsx` (FD-05).
- CHG-009 task switch, "This is a task — must be ticked off": On for Add event, the event's current value for Edit event, local state only (FD-08, AC-05, AC-06).
- Real-browser check (Playwright, production build) against `family-03-edit-event.png` at 1440, and a sweep at 1920, 1440, 1280, 1024, 900 and 768 on both routes: no page scroll, no text overflow, no overlap. Kit and layout differences are recorded in FD-07.

## In progress
- None

## Remaining
- CHG-015: human approval to open the PR to `family-dev`, then review and merge (human).

## Acceptance criteria status
- 9 / 9 MET (AC-07 to AC-09 added by CHG-015)

## Tests
- Written: 6 / 6 plan tests (T-01 to T-06), plus 15 more for PRD states, axe and the CHG-008 contract
- Passing: all feature tests (20 component, 4 contract, 2 e2e; all 5 Family e2e pass)
- Failing: 0 in this feature. The full unit run has 941 passing and 5 failing; the 5 are Supabase integration tests (`tests/integration/shared-authentication.test.ts`, `shared-supabase-environment.test.ts`) that need a local Supabase, and Docker is not installed on this machine. They are unrelated to this change. `supabase test db` was not run for the same reason (no schema changes here).

## Files changed
- `src/app/(family)/family/[clientId]/events/**` (new: edit and new pages, loading, error, not-found, tests)
- `src/features/family-event-form/**` (new)
- `src/features/family-task-detail/document-tile.tsx` (`showDetails` prop, default unchanged)
- `src/server/events/queries.ts`, `src/mocks/queries/events.ts`, `src/server/events/queries.test.ts` (CHG-008)
- `tests/e2e/family-event-form.spec.ts`

## Decisions
- See DECISIONS.md FD-01 to FD-08; root CHG-008, CHG-009 (PR #78).

## Problems encountered
- The e2e run first served a stale production build (404); fixed by rebuilding.
- CHG-009 session: Playwright reused a stale `npm run start` server on port 3000 from an earlier run, and the Add event route hit the error boundary; stopping that server fixed it.

## Assumptions
- Add event layout and copy are PROPOSED (not designed).
- The task switch has no Figma design; its look is PROPOSED (FD-08).

## Next action
- CHG-015: none; #86 merged into `family-dev` (2026-09-24).

## Ready for PR
- Original build: merged to `family-dev` (PR #79, 2026-09-24).
- CHG-015: merged to `family-dev` (PR #86, 2026-09-24).
