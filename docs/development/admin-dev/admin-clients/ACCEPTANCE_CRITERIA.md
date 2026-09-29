# Acceptance Criteria — ADM-04 Admin — Clients list and add client

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

**Rewritten by CHG-035 (2026-09-29)**, applying CHG-010's own instruction: the original AC-01/AC-02
tested an "Add client" flow PD-037 already rejected before this feature started; AC-04 tested rejecting
a client-info update action ADM-04 never had a version of that could still be called (D28 always meant
ADM-04 writes nothing, not that some other action needed blocking). Old AC-03 (list rendering) is kept,
renumbered AC-01.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given seed data, when the list renders, then rows include 'Margaret' with family contact 'Helen'. | MET |
| AC-02 | US-01 | permission | Given another organisation's clients, when Priya's list renders, then they are not included. | MET |
| AC-03 | US-01 | empty | Given an organisation with no clients, when the list renders, then the empty state 'No clients yet' is shown. | MET |
| AC-04 | US-01 | design | Given the Clients screen, when rendered, then there is no 'Add client' panel or button anywhere on it (PD-037/CHG-010: clients are created only by families, not admin). | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
