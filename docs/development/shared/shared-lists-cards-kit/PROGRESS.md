# Progress — UI-03 Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view

Status: NOT STARTED
Owner: unclaimed
Lane: S — Shared kit
Sprint: SPRINT · planned D3
Branch: `feature/shared-lists-cards-kit` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work

## Dependencies status
- F0-14 — NOT STARTED
- UI-00 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `DataTable` (uppercase label header, 50px rows, optional chevron link column) — Task log, Budget History, Staff list, Client list.
- `ActivityRow` (title, short date, status pill, chevron) — Overdue card, Recent activity, Log panel.
- `AlertListCard` (alert tone, warning icon title, count badge, rows, optional caption 'across all clients').
- `SelectableListRow` (avatar + name; selected solid #07727D with white text and check; hover tint) — Admin Manage.
- `PersonCard` (avatar initial, name, '78 years · Preston VIC') — Patients grid.
- `NotificationRow` (source chip Admin neutral / Family brand + message).
- `StatCard` (label + Metric/Large number).
- `BudgetBucketCard` (label caps, remaining metric, 'of $total · N% used', progress bar; states normal/warning/alert/depleted; alert shows warning icon and alert tone).
- `TaskChecklist` (checkbox rows, checked struck through and muted).
- `ClientInfoView` (client summary, section cards Description / Habits / Medical history with optional 'Edit', Documentation file tiles with optional Add file) with `canEdit` prop.

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/components/shared/lists/*`, `src/components/shared/cards/*`, `src/components/shared/client-info-view.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE UI-03, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
