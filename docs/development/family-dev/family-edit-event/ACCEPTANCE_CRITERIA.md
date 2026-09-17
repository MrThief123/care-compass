# Acceptance Criteria — FAM-07 Family — Edit event

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Physiotherapy weekly with description text, when Helen changes the description and saves, then the new description shows on Task detail. | NOT MET |
| AC-02 | US-01 | happy | Given an event with past completions, when its recurrence changes from weekly to fortnightly, then past completions are unchanged in the task log. | NOT MET |
| AC-03 | US-01 | validation | Given the edit form, when Date is cleared and saved, then a Date error is shown. | NOT MET |
| AC-04 | US-01 | permission | Given Robert's family member, when they open Margaret's event edit URL, then they are redirected without data. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
