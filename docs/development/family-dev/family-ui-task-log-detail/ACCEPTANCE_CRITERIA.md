# Acceptance Criteria — FAM-UI-07 Family Task log and Task detail screens (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given fixtures, when Task log renders, then 9 rows appear starting 'Mon 30 Nov · Morning medication · Aisha Rahman · Done · Aisha Rahman' (full names per PD-038, see DECISIONS.md FD-01; the design shows 'Aisha R.'). | BLOCKED (FD-02: shared fixtures lack the design's rows; proven on design-matching rows, not yet on shared fixtures) |
| AC-02 | US-01 | happy | Given status filter Overdue, when applied (`?status=overdue`, answered by the contract across the whole history), then only Weekly weigh-in and Medication review remain, each with nurse '—'. | BLOCKED (FD-02: shared fixtures lack the design's rows; proven on design-matching rows, not yet on shared fixtures) |
| AC-03 | US-01 | empty | Given search 'Zoe', when applied (`?q=Zoe`, answered by the contract across the whole history), then 'No matches for "Zoe".' is shown. | MET |
| AC-04 | US-01 | happy | Given the Morning medication detail, when rendered, then 'Done · Aisha Rahman' and 'Completed at 09:14' are shown (full name per PD-038, see DECISIONS.md FD-01). | BLOCKED (FD-02: shared fixture says 'Completed at 09:05'; proven with 09:14 on design-matching data) |
| AC-05 | US-01 | happy | Added under CHG-005. Given a log longer than one page (for example 137 tasks), when Task log renders, then it shows that page's rows, 'Showing 1-20 of 137', the current page indicated and Next; Next shows 'Showing 21-40 of 137' with Previous; the last page is reachable and shows only the remaining rows; exactly one page, exactly one page size, one over and zero rows all render correctly. | NOT MET |
| AC-06 | US-01 | validation | Added under CHG-005. Given invalid or hostile params (page=0, page=-3, page=abc, page=99999, status=bogus, q of 5,000 characters), when Task log loads, then it falls back to page 1, page 1, page 1, the last page, all statuses and a q capped at 200 characters, and never errors. | NOT MET |
| AC-07 | US-01 | happy | Added under CHG-005. Given a search or Status change, when it is applied, then the URL carries q / status / page (page reset to 1), so a shared link, reload and Back/Forward show the same view; the search box follows the URL. | NOT MET |
| AC-08 | US-01 | happy | Added under CHG-005. Given a Task detail opened from a searched, filtered or paged log, when 'Back to Task log' is used, then it returns to the same q, status and page; links are built only from validated params. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
