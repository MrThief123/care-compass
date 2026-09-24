# Acceptance Criteria — FAM-UI-05 Family Budget screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Budget renders, then NDIS '$14,880', Fixed '$2,750' and Government '$240' cards are shown. | MET |
| AC-02 | US-01 | happy | Given fixtures, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'. | MET |
| AC-03 | US-01 | empty | Given no fund entries, when History renders, then an empty state is shown. | MET |
| AC-04 | US-02 | happy | Given fixtures, when the family presses 'Update', chooses NDIS and Add, enters '500' with no note and saves, then the NDIS card shows '$15,380' remaining and History's first row is the reference day, 'Funds added', '+$500' (local state only; reset on reload). (CHG-020) | NOT MET |
| AC-05 | US-02 | validation | Given Government at $240, when the family removes '40', then Government shows '$200' and History's first row reads 'Funds removed', '-$40'; when they try to remove '300', then 'Only $240 available' is shown and nothing changes. (CHG-020) | NOT MET |
| AC-06 | US-02 | validation | Given the Update form, when the amount is empty, '0', '-5' or '12.345', or no bucket is chosen, then saving is refused with a message on that field and nothing changes. (CHG-020) | NOT MET |
| AC-07 | US-03 | happy | Given a fixture pending cost of $310 on Government, when Budget renders, then the Government card reads 'Pending $310 · 1 cost' in words. (CHG-020) | NOT MET |
| AC-08 | US-03 | happy | Given that pending cost, when History renders, then it is listed with its description, '-$310' and a 'Pending' label in text (not colour alone). (CHG-020) | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
