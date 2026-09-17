# Acceptance Criteria — INT-01 Automatic budget threshold emails

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Government bucket crosses the top warning threshold, when the job runs, then one email per eligible recipient is sent with the client's name and percentage. | NOT MET |
| AC-02 | US-01 | edge | Given the email for that threshold was already sent this period, when the job runs again, then no email is sent. | NOT MET |
| AC-03 | US-01 | permission | Given a previous organisation's admin, when the job runs after transfer, then they receive no email. | NOT MET |
| AC-04 | US-01 | security | Given a request to the job endpoint without the secret, when received, then it returns 401 and does nothing. | NOT MET |
| AC-05 | US-01 | error | Given the email provider errors, when the job runs, then the threshold is not recorded as sent. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
