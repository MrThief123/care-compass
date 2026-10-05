# Session State — INT-07 Scale and performance verification

Last session date: 2026-10-05
Current branch: feature/shared-calendar-scale-performance
Owner: Kav1sh-11
Status: READY FOR PR

Implemented local scale seeding, authenticated benchmarks, indexed recurrence count/seek and exact task-log paging. The human approved the shared-code scope on 2026-10-04. Main 817aa9b is incorporated and remained current at the 2026-10-05 fetch.

Final p95 across twenty samples: Calendar query 415.513 ms, Home 822.447 ms, Calendar page 835.081 ms, Task log 510.408 ms. All pass the unchanged <1,000 ms budget at 50 clients × 500 recurring events.

Validation: verify source suite 2,681 tests; affected real Supabase integration 26 tests; focused recurrence/events/status 173 tests; performance Vitest 4 tests; Playwright 3 tests; production build; isolated pgTAP 930 tests — all PASS. The report explains the shared database's unrelated inactive-profile test assumption and the isolated clone setup.

Current blocker: none for implementation; prior human approval is required before opening an INT-07 PR. INT-06 approval does not authorise this PR.

Exact next action: on human PR approval, fetch/merge current main, run checks affected by any new changes, update status to PR OPEN, refresh/browser-check the status page, commit/push and open the PR to main using the workflow template. Do not merge the PR.

Important files: docs/PERFORMANCE_REPORT.md; docs/INT-07-before.json; docs/INT-07-after.json; scripts/seed-scale.ts; scripts/explain-scale.sql; tests/performance/; src/server/events/build-task-log.ts; src/lib/recurrence/expand.ts.

Local state: scale data remains in the existing Supabase stack. Isolated databases int07_regression_20261004 (incomplete setup) and int07_regression_owned_20261004 (passing pgTAP) were created; no shared reset or data deletion occurred. Runtime logs/profiles are ignored under test-results/int07. No application dependency changed.

Implementation commit: a6d7c9a. Final handoff is this session-state commit on the same feature branch.

Final handoff verification: tracked status page regenerated and opened in Chromium at 390 × 844; no console/page errors and no horizontal overflow. All implementation checks above are complete. The implementation and handoff are committed and pushed on the feature branch; no PR is opened without the human's explicit approval.

Final cleanup: status-page line endings normalized to LF so the PR contains only its five intended data/prose changes. Chromium was rechecked at 390 px: no errors or overflow. No application code changed after final validation.
