# Acceptance Criteria — UI-03 Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a Government bucket 3000 total / 2760 used in alert state, when BudgetBucketCard renders, then it shows '$240', 'of $3,000 · 92% used', a warning icon and the alert tone. | MET |
| AC-02 | US-01 | happy | Given AlertListCard with 3 overdue rows, when rendered, then the badge shows '3' and each row has an 'Overdue' pill. | MET |
| AC-03 | US-01 | happy | Given SelectableListRow selected, when rendered, then it has aria-selected='true' and shows a check icon. | MET |
| AC-04 | US-01 | permission | Given ClientInfoView with canEdit=false, when rendered, then no 'Edit' links and no 'Add file' tile exist. | MET |
| AC-05 | US-01 | happy | Given NotificationRow with source 'family', when rendered, then the chip text is 'Family'. | MET |
| AC-06 | US-01 | happy | Given each component, when checked with axe, then there are no violations. | MET (all 10 components in lists-cards-kit.axe.test.tsx) |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
