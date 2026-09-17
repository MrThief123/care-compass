# Acceptance Criteria — FAM-09 Family — Client info

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Margaret's Habits section, when Helen clicks Edit, changes the text and saves, then the new text is displayed. | NOT MET |
| AC-02 | US-01 | happy | Given seed data, when Info renders, then Description, Habits, Medical history and Documentation cards appear in that order. | NOT MET |
| AC-03 | US-01 | validation | Given the edit textarea exceeds the maximum length, when saved, then an error is shown and the text is not saved. | NOT MET |
| AC-04 | US-01 | permission | Given Priya (admin), when she updates client_info_sections for Margaret, then the update is rejected. | NOT MET |
| AC-05 | US-01 | happy | Given the Documentation card, when Helen adds 'Care plan.pdf', then a tile with that name appears. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
