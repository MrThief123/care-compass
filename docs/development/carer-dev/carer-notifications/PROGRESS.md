# Progress — CAR-02 Carer — Notifications card and bell

Status: MERGED TO DEV
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D9
Branch: `feature/carer-notifications` (from `main`)
PR target: `main` (merged in #174, 2026-09-30)
Last updated: 2026-09-30

## Blockers
- None. OQ-14 answered (PD-048, CHG-025). OQ-34 out of scope.

## Dependencies status
- F0-10 — MERGED
- F0-13 — MERGED
- CAR-UI-01 — MERGED

## Completed
- Docs updated for CHG-025 and the start-of-feature answers: PRD Scope, 12 ACs, TEST_PLAN (14 tests), DECISIONS FD-01 to FD-06.
- Migration `20260930085525_carer_notifications.sql`: table, index, RLS, revoke all from anon and authenticated then grant select and update (read_at), SECURITY DEFINER trigger `notify_carer_of_shift_change` (FD-02, FD-03, FD-06).
- `src/server/notifications`: Supabase branch for `getCarerNotifications` (newest first, limit 50), `getCarerUnreadCount`, `actions.ts` `markCarerNotificationsRead` (mock mode flips `read` on an in-memory copy).
- `NotificationBell`, `UnreadNotificationRow` (local wrapper, shared `NotificationRow` untouched), `tabIndex=-1` on the card heading, additive `PageHeader.bellSlot`, carer layout wiring.
- Fixture text `(Margaret)` -> `(Margaret Doyle)` (FD-03).

## In progress
- Nothing. Waiting for the human's "yes" to open the PR.

## Remaining
- Open the PR after approval (docs update ships inside it).

## Acceptance criteria status

- 12 / 12 MET

## Tests
- Written: 14 / 14 (T-01 to T-14). Passing: all.
- Test files: `supabase/tests/carer_notifications.test.sql`, `src/features/carer-home/notification-bell.test.tsx`, `src/features/carer-home/carer-home.test.tsx`, `src/server/notifications/queries.test.ts`, `src/components/shared/page-header.test.tsx`, `tests/integration/carer-notifications.test.ts`.
- **HUMAN REVIEW: test expectation changed** (FD-03/FD-04a): `(Margaret)` -> `(Margaret Doyle)` in two CAR-UI-01 files; the 'not implemented for supabase' assertion removed.
- **HUMAN REVIEW: test file fixed** (FD-07): `supabase/tests/carer_notifications.test.sql` used a data-modifying CTE inside a subquery, which Postgres rejects. Two assertions now call an invoker-rights helper function instead; same assertions, same plan of 23.
- CI is down. Local commands and results (local Supabase stack; the integration and `npm test` runs used the three env vars from `supabase status -o env`, never the hosted project):
  - `supabase test db supabase/tests/carer_notifications.test.sql`: 23/23 pass. `supabase test db` (all): 15 files, 469 tests pass.
  - `npm run lint`: 0 errors (3 warnings, all in files this feature did not add). `npm run typecheck`: clean. `prettier --check src supabase/tests`: clean.
  - `npm run test:integration` (local): 25 files, 111 tests pass, including `carer-notifications.test.ts`.
  - `npm test` (local env): 2201 pass, 1 fail: `[FAM-UI-01][PRD] has no axe violations on a busy day` timed out at 5s under load; rerun alone, 15/15 pass. Without the local env override 5 integration tests fail against the hosted project (Invalid API key), which is expected and not run against it.
  - `npm run test:e2e -- tests/e2e/shared-app-shell.spec.ts tests/e2e/smoke.spec.ts --grep-invert "F0-07"`: 6 passed.
- Real browser (Playwright): mock mode at 1920, 1440, 1280, 1024, 768 px: no overlap, no horizontal scroll, bell 44x44, long names wrap. Bell click on Home clears the count and focuses the card; on Patients it goes to `/carer/home#carer-home-notifications`. Real-data run on local Supabase: insert, change and cancel gave 'Notifications, 3 unread' after reload; the bell click set all read in the database.

## Files changed
- Docs in this folder; tests listed in TEST_PLAN.md.
- `supabase/migrations/20260930085525_carer_notifications.sql`, `src/lib/supabase/database.types.ts` (only the `carer_notifications` block added).
- `src/server/notifications/{queries,actions}.ts`, `src/mocks/queries/notifications.ts`, `src/mocks/fixtures.ts`.
- `src/features/carer-home/{notification-bell,unread-notification-row,carer-home-view}.tsx`, `src/app/(carer)/carer/layout.tsx`.
- **Outside Lane C: `src/components/shared/page-header.tsx`** (additive optional `bellSlot`, FD-05). Flag in the PR.

## Decisions
- See DECISIONS.md (FD-01 to FD-06)

## Problems encountered
- `npm run db:types` against this machine's local database also dropped unrelated function types, because the local database still carries the unmerged CAR-04 migration. Only the `carer_notifications` block was spliced into `database.types.ts`. Regenerate from a clean `supabase db reset` if a full regeneration is wanted.
- `supabase migration up` refused for the same reason; the migration was applied with psql in the local container, not by reset.

## Assumptions
- `transfer_client_organisation` cancelling future shifts will notify carers through the trigger (FD-02); intended.

## Next action
- None; merged to `main`.

## Ready for PR
- Merged (see PR target above)
