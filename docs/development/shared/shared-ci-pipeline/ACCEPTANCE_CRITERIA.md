# Acceptance Criteria — F0-03 Continuous integration pipeline

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a PR targeting `family-dev`, when it is opened, then lint, typecheck, format, unit test, build, audit and commitlint jobs run. | NOT MET |
| AC-02 | US-01 | error | Given a PR introduces a lint error, when CI runs, then the lint job fails and the overall check is red. | NOT MET |
| AC-03 | US-01 | validation | Given a PR contains a commit message `update`, when CI runs, then the commitlint job fails. | NOT MET |
| AC-04 | US-01 | edge | Given `supabase/tests` exists, when CI runs, then the database test job executes `supabase test db` and fails the check on test failure. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
