# Progress — ADM-07 Admin — Assign shift

Status: IN PROGRESS
Owner: MrThief123
Lane: A — Admin
Sprint: SPRINT · planned D10
Branch: `feature/admin-assign-shift`
PR target: `main` (CHG-036)
Last updated: 2026-10-01 (claimed)

## Blockers
- None (OQ-09 ANSWERED)

## Dependencies status
- F0-10 — MERGED
- ADM-06 — MERGED (#176)

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- Tests written first (2026-10-01) and run red:
  - `src/server/admin/manage-actions.test.ts` — 8/8 fail: `@/server/admin/manage-actions` does not exist yet.
  - `src/features/admin-manage/assign-shift.test.tsx` — 5/8 fail: Assign never calls a server action (local state only), no server error shown, overlap warning says "another client" when the client isn't in the listed (searched) clients. 3 pass already because ADM-UI-02 built them on fixtures (client-side time validation T-03, no Repeat T-04, axe) — expected for a wiring feature.
  - `tests/integration/admin-assign-shift.test.ts` (local Supabase) — 5/6 fail: action module missing; `getAdminManage` returns no shifts in Supabase mode. 1 passes already (another org's admin sees no Banksia shifts — trivially, since none are loaded yet).
  - `tests/e2e/admin-assign-shift.spec.ts` (T-01, AC-01) — written; gated on local Supabase + `E2E_DATA_SOURCE=supabase`.

## Remaining
- Date: month grid (MON–SUN), prev/next, dots where the selected carer already has shifts, selected date filled.
- Time slot chips; 'Custom' reveals start/end time inputs (not drawn — PROPOSED two time inputs).
- Soft conflict inline alert: 'Aisha already has a shift with Margaret from 11:30–13:00 that overlaps this time. You can still assign it.' generated from `overlapping_shifts`.
- Cancel (clears date/slot) and 'Assign shift' (creates shift; success message PROPOSED).
- No Repeat control (D31).

## Acceptance criteria status
- 0 / 4 MET

## Tests
- Written: 0 / 4
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/features/admin-manage/assign-shift-panel.tsx`, `src/components/shared/date-picker-grid.tsx`, `src/server/shifts/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-09; then complete dependencies, run START FEATURE ADM-07, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
