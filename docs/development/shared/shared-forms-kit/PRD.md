# UI-02 — Forms kit: fields, settings cards, side panels, chips, modal, event form

| Field | Value |
|---|---|
| Feature ID | UI-02 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-forms-kit` |
| Documentation | `docs/development/shared/shared-forms-kit/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D3–D4 |
| Status / owner | See PROGRESS.md |

## Purpose
Build form UI once.

## Problem
Eight screens use near-identical form patterns.

## Description
Builds the form patterns used across Settings, Staff, Clients, Manage and the event form.

## User value
Every form in three dashboards looks and validates the same way.

## Users
- Family
- Carer
- Admin

## Scope
- `Field` wrappers: text, email, tel, select, textarea, date — label, hint, inline error, 44px height, focus ring.
- `SettingsActionCard` (title, description, outline action button — 'Change organisation', 'Reset username / password').
- `DetailsFormCard` (card title + two-column field grid — Family info, My info, Organisation info; save affordance slot per OQ-35).
- `SidePanelForm` (panel title, stacked fields, full-width primary button at bottom — Add / edit staff, Add client).
- `ChipGroup` single-select (Status chips Planned/Done/Overdue; time slots 07:00–11:00, 11:00–15:00, 15:00–19:00, Custom revealing two time inputs).
- `InlineAlert` (alert tone with warning icon — overlap warning).
- `ConfirmationModal` (neutral/destructive; title with warning icon, body, Cancel + confirm; close X; focus trap; Escape closes).
- `EventForm` layout: Date field + Recurring select + Status chips + Description + Documents slot on the left; 'Pick a date' `DatePickerGrid` card + Save event + Cancel on the right.
- Zod-based client validation helper shared with future server actions.

## Out of Scope
- Persistence
- Uploads (F0-13/FAM-08)

## Functional Requirements
- Forms report field errors without submitting when invalid.

## UI / UX Requirements
- Match the frames; primary buttons use bg/brand-deep with white text.

## Dependencies
- Features: F0-14 (Core UI primitives and state components), UI-00 (Domain types, data-access contracts and design fixtures), UI-01 (Calendar kit: week/day/month grids, event blocks, date picker)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-10, OQ-22, OQ-35

## Inputs
- Props

## Outputs
- Form components

## Error / Edge Cases
- Custom slot with end before start → inline error.

## Security / Permissions
- None.

## Technical Considerations
- Files in `src/components/shared/forms/`.

## Traceability
- Product requirements: REQ-N1 (Usable by non-technical users aged 55–80 and carers on shared laptops; plain language; des…), REQ-N2 (WCAG 2.1 AA: 4.5:1 text contrast, 44×44px targets, visible focus, status not by colour alo…)
- Sources: Design: Settings (3 roles), Admin Staff, Admin Clients, Admin Manage, Edit event, States sheet confirmation modal; UI-D36
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
