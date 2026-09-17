# Test Plan — F0-01 Validate planning pack against repository, Figma and sources

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **review** → Documented review checklist in PROGRESS.md

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | review | Given the planning pack is in the repository, when F0-01 completes, then docs/VALIDATION_REPORT.md exists and lists the result of every scope check. | ☑ | PASS |
| T-02 | AC-02 | review | Given a discrepancy is found between the plan and the repository, when the report is written, then the discrepancy cites the file path or command output that proves it. | ☑ | PASS |
| T-03 | AC-03 | review | Given an open decision has no human answer, when statuses are re-derived, then every feature listing that decision as BLOCKING is marked BLOCKED. | ☑ | PASS (vacuously — no such feature exists; confirmed via `node scripts/plan-status.mjs`) |
| T-04 | AC-04 | review | Given F0-01 is complete, when `git diff --stat` is run against the starting commit, then only files under docs/ or root *.md planning files have changed. | ☑ | PASS (`git diff --stat main`) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
