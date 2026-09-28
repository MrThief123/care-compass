# Acceptance Criteria — FAM-07 Family — Edit event

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Physiotherapy weekly with description text, when Helen changes the description and saves, then the new description shows on Task detail. | MET |
| AC-02 | US-01 | happy | Given an event with past completions, when its recurrence changes from weekly to fortnightly, then past completions are unchanged in the task log. | MET |
| AC-03 | US-01 | validation | Given the edit form, when Date is cleared and saved, then a Date error is shown. | MET (proven on `EventFormScreen` directly — Edit event's own Date field has no interactive way to clear an already-set date; see DECISIONS.md FD-01/TEST_PLAN.md) |
| AC-04 | US-01 | permission | Given Robert's family member, when they open Margaret's event edit URL, then they are redirected without data. | MET (a 404, the same idiom Task detail and every other permission-gated route in this codebase already uses for "another client's data") |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
