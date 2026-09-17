# Acceptance Criteria — INT-05 Access-control regression matrix

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | security | Given all tables in schema public, when the catalog is queried, then every table has row level security enabled. | NOT MET |
| AC-02 | US-01 | permission | Given each role, when every dashboard route of other roles is requested, then all are redirected. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
