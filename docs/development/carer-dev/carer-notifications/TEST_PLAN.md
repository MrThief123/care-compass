# Test Plan — CAR-02 Carer — Notifications card and bell

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/carer_notifications.test.sql` (pgTAP, `supabase test db`)
- **component** → `src/features/carer-home/*.test.tsx`, `src/components/shared/page-header.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/carer-notifications.test.ts` (against local Supabase, as the other `tests/integration` files)
- **contract (mock)** → `src/server/notifications/queries.test.ts`

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | db | Insert shift for Aisha/Margaret Doyle (Melbourne 09:00–11:00, stored as UTC) → one unread admin `shift_assigned` row with the exact message. | ☑ | FAILING (expected) |
| T-02 | AC-02 | db | Change times → 'Shift changed: …' message; update of an unrelated column → no new row. | ☑ | FAILING (expected) |
| T-03 | AC-03 | db | Set `cancelled_at` → 'Shift cancelled: …' once; a second update of the cancelled shift adds nothing. | ☑ | FAILING (expected) |
| T-04 | AC-04 | db | Change `carer_id` Aisha→Daniel → Aisha `shift_cancelled`, Daniel `shift_assigned`. | ☑ | FAILING (expected) |
| T-05 | AC-05 | db | As Daniel: Aisha's rows invisible; insert refused; update of `message` refused; update of Aisha's `read_at` affects 0 rows; own `read_at` update works. RLS enabled. | ☑ | FAILING (expected) |
| T-06 | AC-06 | component | `CarerHomeView` with 3 notifications (1 read): chips and messages newest first; 'Unread' marker on exactly the 2 unread rows. | ☑ | FAILING (expected) |
| T-07 | AC-07 | component | `NotificationBell`: names and badge for 0, 2, 12 unread. | ☑ | FAILING (expected) |
| T-08 | AC-08 | component | `NotificationBell` on `/carer/home`: click calls `markCarerNotificationsRead`, scrolls and focuses the card, refreshes the router. | ☑ | FAILING (expected) |
| T-09 | AC-09 | component | `NotificationBell` on `/carer/patients`: click pushes `/carer/home#carer-home-notifications`. | ☑ | FAILING (expected) |
| T-10 | AC-10 | integration | As Aisha through the contract: rows newest first, `read` flag, unread count; mark-read touches only hers; Daniel's rows untouched. | ☑ | FAILING (expected) |
| T-11 | AC-11 | component | Mark-read rejects/returns `{ok:false}`: card still scrolled, count unchanged, no names in the page text. | ☑ | FAILING (expected) |
| T-12 | AC-12 | component | axe on the header with the bell and on the card; bell activates with Enter and Space. | ☑ | FAILING (expected) |
| T-13 | AC-06, AC-10 | contract (mock) | Existing `getCarerNotifications` tests updated for the full-name text; `getCarerUnreadCount('staff-aisha')` = 2; unknown carer = 0. | ☑ | FAILING (expected) |
| T-14 | FD-05 | component | `PageHeader` renders `bellSlot` in place of the plain bell; without it, unchanged. | ☑ | FAILING (expected) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run `npm run test:integration` for the new file, `npm run lint`, `npm run typecheck`, and Playwright e2e for the carer shell (`--grep-invert "F0-07"`, see memory notes on the hosted project) before opening the PR. CI is down: list the local commands in the PR.

## Test data
- db tests create their own rows (as `carer_shifts_rpc.test.sql`). Component and mock tests use `CARER_NOTIFICATIONS` (three Aisha shift notifications; Margaret Doyle).

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
