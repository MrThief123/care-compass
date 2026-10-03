# Acceptance Criteria — INT-09 Overdue and upcoming care alert emails

Rewritten 2026-10-03 for OQ-40 / PD-062 (answered by the human).

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a task occurrence that is at least 30 minutes past its due time with no completion, when the job runs, then the client's Family members and the current active admins of the client's organisation each receive one email for it (the carer on shift does not), and one tracking row is recorded after every send succeeded. | NOT MET |
| AC-02 | US-01 | edge | Given that occurrence was already alerted, when the job runs again, then no second email is sent; and given the occurrence was moved by an override, it is still the same occurrence. | NOT MET |
| AC-03 | US-01 | edge | Given a task that is done, cancelled, overdue by less than 30 minutes, or due more than 48 hours ago, or a plain event, when the job runs, then no email is sent for it. | NOT MET |
| AC-04 | US-01 | error | Given the email provider fails for any recipient, when the job runs, then no tracking row is recorded for that occurrence and the next run sends it. | NOT MET |
| AC-05 | US-02 | permission | Given a request without the correct secret, when it calls the job route (GET with `CRON_SECRET`, POST with `JOBS_SECRET`), then it gets a bare 401 and nothing is sent. | NOT MET |
| AC-06 | US-01 | edge | Given a client with no active recipient with an email, an inactive or email-less profile, or a client moved to another organisation, when the job runs, then it skips or targets only the current recipients, records nothing for the skipped client, and logs no personal data. | NOT MET |
| AC-07 | US-01 | edge | Given more than 100 occurrences are due an alert, when the job runs, then at most 100 are sent and the rest are sent by later runs; and the schedule is a daily Vercel Cron entry for the route beside INT-01's and INT-11's. | NOT MET |
| AC-08 | US-03 | happy | Given an alert is sent, then its subject and plain-text body name the task, the client's full name and the due time and date in Australia/Melbourne, say it has not been marked done, and no upcoming-care reminder is ever sent. | NOT MET |
