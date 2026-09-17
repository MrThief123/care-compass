# Progress — UI-02 Forms kit: fields, settings cards, side panels, chips, modal, event form

Status: NOT STARTED
Owner: unclaimed
Lane: S — Shared kit
Sprint: SPRINT · planned D3–D4
Branch: `feature/shared-forms-kit` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work

## Dependencies status
- F0-14 — NOT STARTED
- UI-00 — NOT STARTED
- UI-01 — NOT STARTED

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
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE UI-02, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
