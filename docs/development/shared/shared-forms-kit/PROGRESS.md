# Progress — UI-02 Forms kit: fields, settings cards, side panels, chips, modal, event form

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D3–D4
Branch: `feature/shared-forms-kit` (created from `main` per OQ-01)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-19 (claimed)

## Blockers
- None. OQ-01 ANSWERED 2026-09-17; OQ-10, OQ-22, OQ-35 also ANSWERED in root DECISIONS.md.

## Dependencies status
- F0-14 — MERGED
- UI-00 — MERGED
- UI-01 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- `Field` wrappers: text, email, tel, select, textarea, date — label, hint, inline error, 44px height, focus ring.
- `SettingsActionCard` (title, description, outline action button — 'Change organisation', 'Reset username / password').
- `DetailsFormCard` (card title + two-column field grid — Family info, My info, Organisation info; save affordance slot per OQ-35).
- `SidePanelForm` (panel title, stacked fields, full-width primary button at bottom — Add / edit staff, Add client).
- `ChipGroup` single-select (Status chips Planned/Done/Overdue; time slots 07:00–11:00, 11:00–15:00, 15:00–19:00, Custom revealing two time inputs).
- `InlineAlert` (alert tone with warning icon — overlap warning).
- `ConfirmationModal` (neutral/destructive; title with warning icon, body, Cancel + confirm; close X; focus trap; Escape closes).
- `EventForm` layout: Date field + Recurring select + Status chips + Description + Documents slot on the left; 'Pick a date' `DatePickerGrid` card + Save event + Cancel on the right.
- Zod-based client validation helper shared with future server actions.

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/components/shared/forms/*`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Write T-01..T-06 from TEST_PLAN.md first, confirm they fail for the right reason, then implement `src/components/shared/forms/*`.

## Ready for PR
- No
