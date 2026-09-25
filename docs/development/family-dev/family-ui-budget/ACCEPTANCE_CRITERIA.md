# Acceptance Criteria — FAM-UI-05 Family Budget screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Budget renders, then NDIS '$14,880', Fixed '$2,750' and Government '$240' cards are shown. | MET |
| AC-02 | US-01 | happy | Given fixtures, when History renders, then the first row is '3 Nov 2026', 'NDIS quarterly plan top-up', '+$6,000'. | MET |
| AC-03 | US-01 | empty | Given no fund entries, when History renders, then an empty state is shown. | MET |
| AC-04 | US-02 | happy | Given fixtures, when the family presses 'Edit' on Budget, then the 'Edit budget' page opens; when they add '500' to NDIS with no note and save, then Budget shows NDIS '$15,380' remaining, History's first row is the reference day, 'Funds added', '+$500', and 'Budget updated.' is announced (local state only; reset on reload). (CHG-020, CHG-021) | MET |
| AC-05 | US-02 | validation | Given Government at $240, when the family removes '40' on Edit budget and saves, then Government shows '$200' and History's first row reads 'Funds removed', '-$40'; when they try to remove '300', then 'Only $240 available' is shown on that amount, the page stays open and nothing changes. (CHG-020, CHG-021) | MET |
| AC-06 | US-02 | validation | Given Edit budget, when an amount is '0', '-5', '12.345' or 'abc', a name is empty, longer than 40 characters or the same as another bucket's (ignoring case), or a new bucket has no starting amount, then saving is refused with a message on each such field and nothing changes; Cancel returns to Budget with nothing changed. (CHG-020, CHG-021) | MET |
| AC-07 | US-03 | happy | Given a fixture pending cost of $310 on Government, when Budget renders, then the Government card reads 'Pending $310 · 1 cost' in words. (CHG-020) | MET |
| AC-08 | US-03 | happy | Given that pending cost, when History renders, then it is listed with its description, '-$310' and a 'Pending' label in text (not colour alone). (CHG-020) | MET |
| AC-09 | US-02 | happy | Given fixtures, when the family presses 'Add bucket' on Edit budget, names it 'Council grant' with a starting amount of '1200' and saves, then Budget shows a fourth card 'Council grant' with '$1,200' remaining and History's first row is 'Bucket added', '+$1,200'. (CHG-021) | MET |
| AC-10 | US-02 | happy | Given fixtures, when the family renames 'Fixed' to 'Fixed support' on Edit budget and saves, then the card reads 'Fixed support' with the same figures ('$2,750' remaining) and no History row is added. (CHG-021) | MET |
| AC-11 | US-02 | validation | Given a bucket with nothing spent and no pending costs ('Council grant', $1,200, added as in AC-09), when the family removes it on Edit budget and saves, then its card is gone and History's first row is 'Bucket removed', '-$1,200'; and NDIS (spent) and Government (pending) show no 'Remove bucket' control but say in words why they cannot be removed. (CHG-021) | MET |
| AC-12 | US-02 | empty | Given a client with no buckets, when Budget renders, then the Funds by source card says there is no funding yet and to choose 'Edit' to add a bucket; on Edit budget, 'NDIS', 'Fixed' and 'Government' are offered as name suggestions for a new bucket. (CHG-021) | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
