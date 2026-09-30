# Progress — CAR-02 Carer — Notifications card and bell

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D9
Branch: `feature/carer-notifications` (from `main`)
PR target: `main`
Last updated: 2026-09-30

## Blockers
- None. OQ-14 answered (PD-048, CHG-025). OQ-34 out of scope.

## Dependencies status
- F0-10 — MERGED
- F0-13 — MERGED
- CAR-UI-01 — MERGED

## Completed
- Docs updated for CHG-025 and the start-of-feature answers: PRD Scope, 12 ACs, TEST_PLAN (14 tests), DECISIONS FD-01 to FD-06.

## In progress
- Tests written first (see below); implementation not started.

## Remaining
- Migration `carer_notifications` (table, RLS, trigger) via `supabase migration new`.
- `src/server/notifications`: Supabase branch, `getCarerUnreadCount`, `markCarerNotificationsRead`.
- `NotificationBell` (Lane C client component), unread marker on card rows, `PageHeader.bellSlot`, carer layout wiring.
- Fixture and test text `(Margaret)` → `(Margaret Doyle)`. **HUMAN REVIEW: test expectation changed** (FD-03).
- Preview for the human (SESSION_STATE.md).

## Acceptance criteria status
- 0 / 12 MET

## Tests
- Written: 14 / 14 (T-01 to T-14)
- Passing: 0 · Failing: all, for the expected reason (missing table, component, contract)

## Files changed
- Docs in this folder; tests listed in TEST_PLAN.md.

## Decisions
- See DECISIONS.md (FD-01 to FD-06)

## Problems encountered
- None

## Assumptions
- `transfer_client_organisation` cancelling future shifts will notify carers through the trigger (FD-02); intended.

## Next action
- Start the implementation session with the prompt in SESSION_STATE.md.

## Ready for PR
- No
