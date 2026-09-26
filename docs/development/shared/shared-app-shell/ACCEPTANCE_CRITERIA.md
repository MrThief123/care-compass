# Acceptance Criteria — F0-15 Role app shell: rail, header and layouts

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen viewing Margaret's record, when the Family header renders, then 'Margaret' is the page title with subline '78 years · Preston VIC · Banksia Home Care' and 'Helen' appears separately at the right. | MET (see FD-02 — live figures for Margaret are '75 years · Ringwood', not '78 · Preston') |
| AC-02 | US-01 | happy | Given the Family rail, when rendered, then items are exactly Home, Info, Calendar, Budget, Settings in that order. | MET |
| AC-03 | US-02 | happy | Given the Carer rail, when rendered, then items are exactly Home, Patients, Settings (Calendar removed by CHG-031, 2026-09-26). | MET |
| AC-04 | US-02 | happy | Given the Admin rail, when rendered, then items are exactly Home, Manage, Staff, Clients, Settings. | MET |
| AC-05 | US-02 | permission | Given the Family or Admin header, when rendered, then no bell button exists in the DOM; given the Carer header, then a bell button exists. | MET |
| AC-06 | US-02 | happy | Given Aisha on /carer/patients (was /carer/calendar, removed by CHG-031), when the page loads, then the Patients rail item is marked active (aria-current='page'). | MET (verified against `next dev`, not `next build` — see DECISIONS.md FD-03) |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
