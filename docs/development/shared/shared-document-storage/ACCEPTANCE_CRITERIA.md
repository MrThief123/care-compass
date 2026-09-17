# Acceptance Criteria — F0-13 Client document storage

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen is Margaret's family, when she uploads 'Care plan.pdf' within the allowed size, then a documents row exists and the object is stored under Margaret's path. | NOT MET |
| AC-02 | US-01 | happy | Given an existing document, when Helen requests its URL, then a signed URL is returned that expires. | NOT MET |
| AC-03 | US-01 | validation | Given a file type not in the allowed list, when uploaded, then it is rejected with a plain-language message and nothing is stored. | NOT MET |
| AC-04 | US-01 | permission | Given Robert's family member, when they request Margaret's document object, then access is denied. | NOT MET |
| AC-05 | US-01 | edge | Given a document is detached, when documents for the event are listed, then it is excluded but the row and object still exist. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
