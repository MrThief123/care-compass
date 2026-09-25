# Acceptance Criteria — ADM-11 Admin — Client view

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Cover: happy path, validation, errors, permissions, empty states, relevant edge cases.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given an admin on Admin · Clients, when they click a client's name, then `/admin/clients/<clientId>/home` opens that client's Family Home inside the admin layout, with the client's name and a "Back to clients" link. | NOT MET |
| AC-02 | US-01 | happy | Given an admin in a client view, when they move between Home, Info, Calendar, Budget and Care log, then each shows that client's data as the family sees it. | NOT MET |
| AC-03 | US-02 | happy | Given an admin in a client's Budget, when they add $500 to NDIS, then the bucket and History update and the entry reads "Recorded by <admin name>". | NOT MET |
| AC-04 | US-02 | happy | Given an admin in a client view, when they edit client information, add an event with a cost, or mark a task done, then it saves and the change names the admin. | NOT MET |
| AC-05 | US-03 | permission | Given an admin of another organisation, when they open `/admin/clients/<clientId>/…` for a client that isn't theirs, then they get the not-found page and no data, and a direct database write is refused by RLS. | NOT MET |

Types: happy · validation · error · permission · empty · edge · security.
Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
