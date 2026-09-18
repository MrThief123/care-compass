# Progress — UI-02 Forms kit: fields, settings cards, side panels, chips, modal, event form

Status: READY FOR PR
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D3–D4
Branch: `feature/shared-forms-kit` (created from `main` per OQ-01)
PR target: `main` (per OQ-01 — shared work)
Last updated: 2026-09-19

## Blockers
- None. OQ-01 ANSWERED 2026-09-17; OQ-10 (PD-044), OQ-22 (PD-047) and OQ-35 also ANSWERED in root DECISIONS.md.

## Dependencies status
- F0-14 — MERGED
- UI-00 — MERGED
- UI-01 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- `Field` wrappers: text, email, tel, select, textarea, date — label, hint, inline error, 44px height, focus ring
- `SettingsActionCard` (title, description, outline action button)
- `DetailsFormCard` (card title + two-column field grid; optional per-card Save affordance, OQ-35 / FD-05)
- `SidePanelForm` (panel title, stacked fields, full-width primary button; real `<form>` so Enter submits)
- `ChipGroup` single-select (radiogroup, roving tabindex, arrow-key navigation, per-option `disabled`)
- `TimeSlotChips` (07:00–11:00, 11:00–15:00, 15:00–19:00, Custom revealing two time inputs)
- `InlineAlert` (alert tone, warning icon — overlap warning)
- `ConfirmationModal` (neutral/destructive; title with warning icon, body, Cancel + confirm; close X; focus trap; Escape closes; focus returns to trigger)
- `EventForm` layout (Date, Recurring, Status chips, Description, Documents slot on the left; 'Pick a date' `DatePickerGrid` card, Save event, Cancel on the right)
- Zod-based client validation helper (`fieldErrors`, `requiredText`, `customTimeRangeSchema`) shared with future server actions
- Dev-only preview route `src/app/dev-preview-forms-kit/` (FD-04)

## In progress
- None

## Remaining
- Human review of the two design-gap items (FD-01, FD-02), then PR to `main`.

## Acceptance criteria status
- 6 / 6 MET

## Tests
- Written: 6 / 6 (all written before implementation — commit `fe05361`, which fails on unresolved imports)
- Passing: 52 assertions across 7 files in `src/components/shared/forms/`
- Failing: 0

## Files changed
- `src/components/shared/forms/` — `field.tsx`, `chip-group.tsx`, `time-slot-chips.tsx`, `settings-action-card.tsx`, `details-form-card.tsx`, `side-panel-form.tsx`, `inline-alert.tsx`, `confirmation-modal.tsx`, `event-form.tsx`, `validation.ts`, `index.ts` (+ 7 test files)
- `src/app/dev-preview-forms-kit/page.tsx` (dev-only, FD-04)
- This feature's docs

Only lane-S folders touched (CLAUDE.md §4.2). No shared primitive in `src/components/ui/` was modified — `ConfirmationModal` focuses the first focusable node in the dialog rather than adding ref forwarding to `Button`.

## Decisions
- See DECISIONS.md — FD-01 … FD-07.

## Problems encountered
- `npm run build` fails prerendering `/admin/clients` because `src/mocks/current-user` throws by design in production until F0-07. Verified identical on a clean `origin/main` checkout, so it is **not** a regression from this branch. See FD-07.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## HUMAN REVIEW
Two places where this build knowingly departs from the Edit event frame, both required by answered decisions and flagged per PD-053. Both are visible at `/dev-preview-forms-kit`:
1. **FD-01** — the Overdue chip is rendered but **not selectable** (PD-044: Overdue is derived). The frame draws it as selectable.
2. **FD-02** — the Recurring select offers **all nine** PD-046 frequencies. The frame shows only "Weekly".

No test expectation was changed after implementation began.

## Next action
- Await human approval, then open the PR to `main`.

## Ready for PR
- Yes — pending the human approval gate (`docs/DEVELOPMENT_WORKFLOW.md` §7).
