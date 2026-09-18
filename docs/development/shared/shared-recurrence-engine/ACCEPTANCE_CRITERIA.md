# Acceptance Criteria — F0-09 Recurrence engine (pure TypeScript)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a weekly rule anchored Monday 30 Nov 2026 09:00, when expanded for 30 Nov–13 Dec 2026, then exactly two occurrences are returned: 30 Nov 09:00 and 7 Dec 09:00. | MET |
| AC-02 | US-01 | happy | Given a yearly rule anchored 30 Nov 2026, when expanded for the year 2066, then one occurrence on 30 Nov 2066 is returned. | MET |
| AC-03 | US-01 | edge | Given a monthly rule anchored 31 Jan 2027, when expanded for February 2027, then one occurrence on 28 Feb 2027 is returned (PROPOSED clamp rule). | MET |
| AC-04 | US-01 | edge | Given a daily 09:00 rule, when expanded across the April 2027 DST change in Australia/Melbourne, then every occurrence is at 09:00 local time. | MET |
| AC-05 | US-02 | happy | Given a weekly rule and a cancellation override for 7 Dec 2026, when expanded for 30 Nov–20 Dec, then 30 Nov and 14 Dec are returned and 7 Dec is not. | MET |
| AC-06 | US-02 | happy | Given a modification override moving 7 Dec 09:00 to 8 Dec 10:00, when expanded, then the occurrence appears on 8 Dec 10:00 with originalStart 7 Dec 09:00. | MET |
| AC-07 | US-02 | validation | Given a rule with interval 0, when validated, then validation fails with an interval error. | MET |
| AC-08 | US-02 | edge | Given 500 weekly rules, when expanded over a 6-week range, then expansion completes in under 100 ms. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
