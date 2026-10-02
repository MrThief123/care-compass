# Acceptance Criteria — INT-11 Email Family and admins when an event cost goes pending

Status: APPROVED (CHG-052, 2026-10-02); all MET. IDs are `[INT-11][AC-xx]`.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given an event cost the bucket cannot cover in full, held as pending, when the job runs, then the client's Family members and active admins of the client's organisation each receive an email reading "A cost of $X for <event> could not be covered by <bucket> and is pending. Add funds to pay it. Log in and refer to plan." naming the right amount, event and bucket and no client or staff name. | MET |
| AC-02 | US-01 | idempotency | Given a pending cost already emailed, when the job runs again (re-run, retry or overlapping run), then no email is sent for it and no second marker is recorded. | MET |
| AC-03 | US-01 | trigger | Given a cost that was charged paid, or a pending cost later paid off by added funds before the job ran, when the job runs, then no email is sent for it; and a cost emailed as pending that is later paid is never emailed again. | MET |
| AC-04 | US-01 | edge | Given several costs pending in one run for the same client, when the job runs, then each recipient gets one email listing one line per cost (each naming its own bucket) and every listed cost is marked notified; a single cost gives a one-line email. (Digest confirmed by the human, FD-03.) | MET |
| AC-05 | US-01 | permission | Given a client with Family, admins, a carer assigned, an admin of another organisation, a family member of another client and an inactive profile, when the job runs, then only the client's Family and active admins of the client's current organisation are emailed; a client transferred away from an organisation never reaches its old admins. | MET |
| AC-06 | US-01 | failure | Given the email provider fails for a recipient, when the job runs, then the cost is not marked notified, the failure is reported in the result by cost id only, the job continues with other clients, and the next run retries it. | MET |
| AC-07 | US-01 | security | Given any run, when it logs or returns its result, then no name, amount, event title, bucket name or address appears there; and `budget_pending_cost_notifications` and its function are unreachable by anon and authenticated roles, and the endpoint returns a bare 401 without the secret. | MET |
| AC-08 | US-01 | regression | Given INT-01's and INT-10's tests and F0-12's pgTAP, when they run, then they pass unchanged. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
