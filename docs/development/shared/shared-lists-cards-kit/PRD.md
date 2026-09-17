# UI-03 — Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view

| Field | Value |
|---|---|
| Feature ID | UI-03 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-lists-cards-kit` |
| Documentation | `docs/development/shared/shared-lists-cards-kit/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D3 |
| Status / owner | See PROGRESS.md |

## Purpose
Build list/card UI once.

## Problem
The same rows and cards repeat across dashboards.

## Description
Builds the list and card patterns shown across all dashboards.

## User value
Screens become compositions, enabling fast parallel screen work.

## Users
- Family
- Carer
- Admin

## Scope
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

## Out of Scope
- Data fetching
- Screen composition

## Functional Requirements
- Edit and add controls render only when `canEdit` is true (controls absent, not disabled).

## UI / UX Requirements
- Match frames; tabular numerals for money and dates.

## Dependencies
- Features: F0-14 (Core UI primitives and state components), UI-00 (Domain types, data-access contracts and design fixtures)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-03, OQ-38, OQ-39

## Inputs
- Props

## Outputs
- List and card components

## Error / Edge Cases
- Long names truncate with full text in accessible label.

## Security / Permissions
- None.

## Technical Considerations
- Files in `src/components/shared/lists/` and `src/components/shared/cards/`.

## Traceability
- Product requirements: REQ-17 (Exactly three statuses — Planned, Done, Overdue — never conveyed by colour alone; Overdue …), REQ-19 (Completion records who did it and when (including temporary staff) as an unalterable histo…), REQ-27 (Each funding bucket shows $ remaining, $ total and % used individually; buckets in trouble…), REQ-10 (Client information page with key descriptive, habit and medical information and documentat…)
- Sources: Design: Family Home, Budget, Task log, Task detail, Info; Carer Home, Patients; Admin Home, Manage, Staff, Clients; UI-D7, D17, D20
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
