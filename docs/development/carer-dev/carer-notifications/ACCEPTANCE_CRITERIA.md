# Acceptance Criteria — CAR-02 Carer — Notifications card and bell

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Priya assigns Aisha a shift on Tue 1 Dec 09:00–11:00 for Margaret, when the insert commits, then a notification for Aisha with source 'admin' and message 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' exists. | NOT MET |
| AC-02 | US-01 | happy | Given Helen uploads a client document for Margaret, when it commits, then each carer assigned to Margaret receives a 'family' notification. | NOT MET |
| AC-03 | US-01 | permission | Given Daniel, when he selects notifications, then Aisha's notifications are not returned. | NOT MET |
| AC-04 | US-01 | happy | Given three notifications, when the card renders, then each row shows its source chip and message newest first. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
