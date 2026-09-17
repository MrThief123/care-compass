# Acceptance Criteria — F0-01 Validate planning pack against repository, Figma and sources

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given the planning pack is in the repository, when F0-01 completes, then docs/VALIDATION_REPORT.md exists and lists the result of every scope check. | NOT MET |
| AC-02 | US-01 | happy | Given a discrepancy is found between the plan and the repository, when the report is written, then the discrepancy cites the file path or command output that proves it. | NOT MET |
| AC-03 | US-01 | permission | Given an open decision has no human answer, when statuses are re-derived, then every feature listing that decision as BLOCKING is marked BLOCKED. | NOT MET |
| AC-04 | US-01 | edge | Given F0-01 is complete, when `git diff --stat` is run against the starting commit, then only files under docs/ or root *.md planning files have changed. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
