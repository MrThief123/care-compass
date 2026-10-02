# Acceptance Criteria — INT-09 Overdue and upcoming care alert emails

PROVISIONAL: rewritten when OQ-40 is answered. Do not implement against these until then.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a task that is overdue by the OQ-40 delay, when the job runs, then the OQ-40 recipients each receive one email and one tracking row is recorded. | NOT MET |
| AC-02 | US-01 | edge | Given that task was already alerted, when the job runs again, then no second email is sent. | NOT MET |
| AC-03 | US-01 | edge | Given a task that is completed, cancelled, or a plain event, when the job runs, then no email is sent. | NOT MET |
| AC-04 | US-01 | error | Given the email provider fails, when the job runs, then nothing is recorded and the next run sends it. | NOT MET |
| AC-05 | US-02 | permission | Given a request without the correct secret, when it calls the job route, then it gets a bare 401 and nothing is sent. | NOT MET |
