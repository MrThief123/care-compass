# Progress — INT-07 Scale and performance verification

Status: PR OPEN
Owner: Kav1sh-11
Lane: I — Integration
Sprint: SPRINT · planned D19
Branch: `feature/shared-calendar-scale-performance`
PR target: `main`
Last updated: 2026-10-05

## Blockers

None. The human explicitly approved opening the INT-07 PR on 2026-10-05 and instructed that no work follow its creation.

## Dependencies and decisions

FAM-14 and ADM-01 are merged to main; OQ-01 and OQ-17 are answered. The human confirmed 50 × 500 recurring events and p95 < 1,000 ms (FD-01), then approved the shared server/recurrence fix (FD-06). Main `817aa9b` was merged in `4c9d388`; fetch on 2026-10-05 confirmed it remains current.

## Completed

- Repeatable local-only scale seed and authenticated query/page benchmarks.
- EXPLAIN ANALYZE evidence: existing indexes suffice; no INT-07 schema migration.
- Indexed recurrence count/seek and task-log page assembly, preserving exact totals, filters, ordering, completions/overrides, DST and RLS.
- Performance report and before/after raw timings.
- AC-01 MET. Final p95: query 415.513 ms; Home 822.447 ms; Calendar 835.081 ms; Task log 510.408 ms. Twenty samples each; unchanged budget.

## Tests

Tests-first commits: `613e394` (missing scale module), `195a238` (missing indexed readers), `754f6f6` (failing overflow/DST-gap completion cases). Original assertions retained.

- Verify with four workers: lint/typecheck/format + 229 files / 2,681 source tests PASS.
- Focused recurrence/events/status: 173 tests PASS.
- Real affected Supabase integration: 26 tests PASS, including cross-client denial checks.
- Performance utilities/query: 4 tests PASS; production page checks: 3 PASS.
- Production build PASS; isolated pgTAP 34 files / 930 tests PASS.
- Shared database pgTAP had one pre-existing global inactive-profile assumption failure; isolated schema/grants plus the migration-defined bucket passed without changing tests or shared data. See report for setup details and workload limits.

## Remaining

Human review of the PR to main. Runtime evidence is ignored; the committed report and JSON contain methods and non-secret samples. No follow-up action will be taken after opening the PR in this session.

PR handoff — 2026-10-05: main remains 817aa9b; existing validation remains current. Human approval received. The PR is opened as the final action after this handoff commit/push.
