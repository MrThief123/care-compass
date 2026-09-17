# Acceptance Criteria — FAM-08 Family — Event documents (file tiles)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given the Edit event form, when Helen adds 'Physio referral.pdf' and saves, then a tile 'Physio referral.pdf' appears on the event. | NOT MET |
| AC-02 | US-01 | validation | Given a disallowed file type, when selected, then an inline error is shown and no tile is added. | NOT MET |
| AC-03 | US-01 | happy | Given an existing tile, when clicked, then the document opens via a signed URL. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
