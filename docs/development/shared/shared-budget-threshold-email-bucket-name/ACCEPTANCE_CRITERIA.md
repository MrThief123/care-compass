# Acceptance Criteria — INT-10 Budget threshold email names the bucket

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a client with two buckets and only one crossing a threshold, when the job runs, then each recipient's email names the client, the percentage and that bucket's name, and not the other bucket's. | MET |
| AC-02 | US-01 | edge | Given a client with a single bucket, when the job runs, then the email names the bucket and still reads as one plain sentence. | MET |
| AC-03 | US-01 | security | Given any run, when the job logs or returns its result, then no bucket name, client name or email address is added to logs or the result. | MET |
| AC-04 | US-01 | regression | Given INT-01's five criteria, when its tests run, then they pass unchanged. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
