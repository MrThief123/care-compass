# Acceptance Criteria — ADM-04 Admin — Clients list and add client

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Priya enters Client name 'Harold', Family contact 'Grace', email 'grace@example.com' and clicks Add client, then Harold appears in the list with family contact 'Grace'. | NOT MET |
| AC-02 | US-01 | validation | Given Client name is empty, when Add client is pressed, then an error is shown. | NOT MET |
| AC-03 | US-01 | happy | Given seed data, when the list renders, then rows include 'Margaret' with family contact 'Helen'. | NOT MET |
| AC-04 | US-01 | permission | Given Priya, when she calls the client-info update action, then it is rejected (D28). | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
