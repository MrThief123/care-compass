# Acceptance Criteria — FAM-UI-01 Family Home screen (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Family Home renders, then the Today panel shows Morning medication (Done · Aisha Rahman), Physiotherapy (Planned, 1 hr 30 min) and Afternoon check-in (Planned). | MET |
| AC-02 | US-01 | happy | Given fixtures, when rendered, then the Overdue card badge is '3' and lists Wound dressing check (Fri 27 Nov), Medication review (Sat 28 Nov), Weekly weigh-in (Sun 29 Nov). | MET |
| AC-03 | US-01 | happy | Given fixtures, when rendered, then the budget line reads '$17,870 remaining of $32,000 · 44% used' and Government is in alert state. | MET |
| AC-04 | US-01 | happy | Given Recent activity, when 'View all' is clicked, then navigation targets `/family/<id>/tasks`. | MET |
| AC-05 | US-01 | empty | Given no overdue fixtures, when rendered, then 'All caught up' is shown in the Overdue card. | MET |
| AC-06 | US-01 | error | Given the contract query rejects, when rendered, then 'Something went wrong' with Retry is shown. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).

## Notes (2026-09-20)
- AC-02 is worded for the design's data (badge 3). On the mock fixtures (UI-04) the Overdue badge reads 2 (Medication review, Weekly weigh-in), by the human's decision ("Doesn't matter", DECISIONS.md FD-19). The badge always shows the contract's `total`; AC-02's 3 is proven at component level with a three-item stub. The AC text is not changed.
- All six ACs also hold for real-world volumes (see TEST_PLAN.md): a log of 500+ occurrences, 30+ occurrences in one day, 40 overdue items, zero of everything, titles up to 120 characters, names up to 60, non-ASCII text, 0/1/3/8 buckets, $1,234,567.89, a zero-dollar budget and an over-100% bucket. These are tagged `[FAM-UI-01][PRD]`.
