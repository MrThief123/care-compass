# Acceptance Criteria — UI-01 Calendar kit: week/day/month grids, event blocks, date picker

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given 2 Dec 2026, when `weekRange` runs, then it returns Mon 30 Nov – Sun 6 Dec 2026. | NOT MET |
| AC-02 | US-01 | happy | Given events at 09:00 (60 min) and 11:30 (90 min), when `positionBlocks` runs from 07:00 with 44px rows, then tops are 88px and 198px and heights 44px and 66px. | NOT MET |
| AC-03 | US-01 | happy | Given the fixture week of 30 Nov, when `WeekGrid` renders, then MON 30 is highlighted and '09:30 Weekly weigh-in' appears under THU 3. | NOT MET |
| AC-04 | US-01 | happy | Given `DatePickerGrid` for November 2026 with items on 24, 26, 27 and selected 30, when rendered, then those days show dots and 30 is filled. | NOT MET |
| AC-05 | US-01 | happy | Given `CalendarHeader` without a view prop, when rendered, then W is selected and the label reads '30 Nov – 6 Dec 2026'. | NOT MET |
| AC-06 | US-01 | happy | Given each calendar component, when checked with axe, then there are no violations. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
