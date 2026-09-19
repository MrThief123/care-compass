# Acceptance Criteria — UI-02 Forms kit: fields, settings cards, side panels, chips, modal, event form

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | validation | Given a required Date field left empty, when the form is submitted, then 'Date' shows an inline error and onSubmit is not called. | MET |
| AC-02 | US-01 | happy | Given the destructive ConfirmationModal is open, when Escape is pressed, then onCancel is called and focus returns to the trigger. | MET |
| AC-03 | US-01 | happy | Given time slot ChipGroup, when 'Custom' is selected, then start and end time inputs appear. | MET |
| AC-04 | US-01 | validation | Given Custom start 12:00 and end 10:00, when validated, then an end-time error is shown. | MET |
| AC-05 | US-01 | happy | Given EventForm with fixture 'Physiotherapy', when rendered, then Date shows 'Monday 30 November 2026', Recurring 'Weekly', Planned chip selected, and a 'Pick a date' calendar. | MET |
| AC-06 | US-01 | happy | Given each form component, when checked with axe, then there are no violations. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
