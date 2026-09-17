# Acceptance Criteria — FAM-04 Family Calendar — day, week and month views

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given no view param, when the calendar renders on Mon 30 Nov 2026, then W is selected and columns MON 30 to SUN 6 are shown with 30 highlighted. | NOT MET |
| AC-02 | US-01 | happy | Given date 2 Dec 2026, when `weekRange` runs, then it returns Mon 30 Nov 2026 to Sun 6 Dec 2026. | NOT MET |
| AC-03 | US-01 | happy | Given the week of 30 Nov with seed data, when rendered, then '09:30 Weekly weigh-in' appears in the THU 3 column. | NOT MET |
| AC-04 | US-01 | happy | Given the week view, when M is selected, then a month grid for December 2026 is shown with out-of-month days styled muted. | NOT MET |
| AC-05 | US-01 | edge | Given a weekly event anchored 2026, when the week of 5 Jan 2060 is viewed, then its occurrence is displayed. | NOT MET |
| AC-06 | US-01 | validation | Given `date=not-a-date`, when the page renders, then the current week is shown. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
