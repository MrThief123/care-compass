# Acceptance Criteria — F0-11 Care events, occurrence overrides and append-only completions

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a weekly 09:00 'Morning medication' event for Margaret, when `getOccurrences` runs for 30 Nov–6 Dec 2026, then it returns the weekly occurrences in that range with status 'planned' for future ones. | MET |
| AC-02 | US-01 | happy | Given an occurrence whose due time has passed and has no done completion, when `deriveStatus` runs, then status is 'overdue'. | MET |
| AC-03 | US-01 | happy | Given an occurrence with a latest completion action 'done' by Aisha Rahman, when `deriveStatus` runs, then status is 'done' with actor label 'Aisha R.'. | MET |
| AC-04 | US-02 | happy | Given Helen is Margaret's family, when she calls `set_occurrence_done` for an occurrence, then a completion row with actor_id Helen is inserted. | MET |
| AC-05 | US-02 | permission | Given Aisha is assigned to Margaret but not on an active shift, when she calls `set_occurrence_done`, then it is rejected (per OQ-09 default). | MET |
| AC-06 | US-02 | permission | Given any user, when they try to UPDATE or DELETE a completion row, then the statement is rejected. | MET |
| AC-07 | US-02 | permission | Given Robert's family member, when they select Margaret's events, then zero rows are returned. | MET |
| AC-08 | US-02 | edge | Given an event is deactivated, when occurrences are requested for next month, then none are returned, and past completions still appear in history queries. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
