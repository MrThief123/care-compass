# Progress — FAM-UI-03 Family Add / Edit event screens (UI)

Status: READY FOR PR
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D5
Branch: `feature/family-ui-event-form` (created from `origin/family-dev` at 9053abd)
PR target: `family-dev`
Last updated: 2026-09-24

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
- Real-browser check (Playwright, production build) against `family-03-edit-event.png` at 1440, and a sweep at 1920, 1440, 1280, 1024, 900 and 768 on both routes: no page scroll, no text overflow, no overlap. Kit and layout differences are recorded in FD-07.

## In progress
- None

## Remaining
- Human approval to open the PR to `family-dev`.

## Acceptance criteria status
- 4 / 4 MET

## Tests
- Written: 4 / 4 plan tests (T-01 to T-04), plus 15 more for PRD states, axe and the CHG-008 contract
- Passing: all feature tests (17 component, 4 contract, 2 e2e)
- Failing: 0 in this feature. The full unit run has 938 passing and 5 failing; the 5 are Supabase integration tests (`tests/integration/shared-authentication.test.ts`, `shared-supabase-environment.test.ts`) that need a local Supabase, and Docker is not installed on this machine. They are unrelated to this change. `supabase test db` was not run for the same reason (no schema changes here).

## Files changed
- `src/app/(family)/family/[clientId]/events/**` (new: edit and new pages, loading, error, not-found, tests)
- `src/features/family-event-form/**` (new)
- `src/features/family-task-detail/document-tile.tsx` (`showDetails` prop, default unchanged)
- `src/server/events/queries.ts`, `src/mocks/queries/events.ts`, `src/server/events/queries.test.ts` (CHG-008)
- `tests/e2e/family-event-form.spec.ts`

## Decisions
- See DECISIONS.md FD-01 to FD-07; root CHG-008.

## Problems encountered
- The e2e run first served a stale production build (404); fixed by rebuilding.

## Assumptions
- Add event layout and copy are PROPOSED (not designed).

## Next action
- Get human approval, then open PR "FAM-UI-03 Family Add / Edit event screens (UI)" to `family-dev`.

## Ready for PR
- Yes, pending human approval
