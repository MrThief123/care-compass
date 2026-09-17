# Test Plan — INT-08 Release readiness and client handover

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **review** → Documented review checklist in PROGRESS.md

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | review | Given the handover pack, when reviewed by a non-technical reader, then every technical term used appears in the glossary. | ☐ | NOT RUN |
| T-02 | AC-02 | review | Given the runbook, when a team member follows it on a clean environment, then the app deploys and a backup restore succeeds. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
