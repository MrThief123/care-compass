# Progress — FAM-UI-03 Family Add / Edit event screens (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D5
Branch: `feature/family-ui-event-form-origin` (CHG-015 follow-up, created from `origin/family-dev` at d7ccf71). The original build, `feature/family-ui-event-form`, was merged to `family-dev` in PR #79 on 2026-09-24.
PR target: `family-dev`
Last updated: 2026-09-24

**CHG-015 (2026-09-24), in progress:** Save and Cancel on Edit event and Add event go to a validated origin instead of `router.back()`, and Task detail's "Edit event" button passes the occurrence being viewed (closes FAM-UI-07 FD-29).

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
- Review and merge of the PR to `family-dev` (human).

## Acceptance criteria status
- 6 / 6 MET

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
- Wait for review of PR "FAM-UI-03 Family Add / Edit event screens (UI)" to `family-dev`; address review comments on this branch.

## Ready for PR
- Yes; PR opened to `family-dev` on 2026-09-24 after human approval.
