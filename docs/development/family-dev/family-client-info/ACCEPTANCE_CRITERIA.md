# Acceptance Criteria — FAM-09 Family — Client info

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Margaret's Habits section, when Helen clicks Edit, changes the text and saves, then the new text is displayed and is still there after a reload. | NOT MET |
| AC-02 | US-01 | happy | Given seed data, when Info renders, then Description, Habits, Medical history and Documentation cards appear in that order. | NOT MET |
| AC-03 | US-01 | validation | Given the edit textarea exceeds the maximum length, when saved, then an error is shown and the text is not saved. | NOT MET |
| AC-04 | US-01 | permission | Given an admin of another organisation, or a family member not linked to Margaret, when they insert or update client_info_sections for Margaret, then the write is rejected. (Priya, admin of Margaret's own organisation, may write: FD-05.) | NOT MET |
| AC-05 | US-01 | happy | Given the Documentation card, when Helen adds 'Care plan.pdf', then a tile with that name appears and it is still listed after a reload. | NOT MET |
| AC-06 | US-01 | validation | Given a file that is not allowed or is over 20 MB, when Helen adds it, then the message is shown and no tile is added. | NOT MET |
| AC-07 | US-01 | error | Given a save the server refuses or that fails, when Helen presses Save, then the message shows under the box and her draft stays. | NOT MET |
| AC-08 | US-01 | empty | Given a section that was never written, when Info renders, then its card shows 'Nothing added yet.' with Edit. | NOT MET |
| AC-09 | US-01 | audit | Given Helen saves a section, then the audit log holds an UPDATE or INSERT row with her as the actor and Margaret as the client. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
