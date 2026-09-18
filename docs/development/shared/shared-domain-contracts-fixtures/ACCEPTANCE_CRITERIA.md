# Acceptance Criteria — UI-00 Domain types, data-access contracts and design fixtures

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given `displayName('Aisha Rahman')`, when called, then it returns 'Aisha Rahman' (full name — see FD-01 in DECISIONS.md: supersedes the original 'Aisha R.' abbreviation per root DECISIONS.md PD-038/OQ-13, CONFIRMED). | MET |
| AC-02 | US-01 | happy | Given `formatDuration(90)` and `formatDuration(60)`, when called, then they return '1 hr 30 min' and '1 hr'. | MET |
| AC-03 | US-01 | happy | Given `formatLongDate` for 2026-11-30, when called, then it returns 'Monday 30 November 2026'. | MET |
| AC-04 | US-01 | happy | Given DATA_SOURCE=mock, when `getBudgetSummary(<Margaret>)` is called, then NDIS remaining 14880 / total 24000 / 38%, Fixed 2750 / 5000 / 45%, Government 240 / 3000 / 92% are returned. | MET |
| AC-05 | US-01 | security | Given NODE_ENV=production, when the mock current-user module is used, then it throws. | MET |
| AC-06 | US-01 | validation | Given a file under `src/app` or `src/features` imports from `src/mocks`, when lint runs, then lint fails (restricted import). | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
