# Acceptance Criteria — FAM-11 Family — Update funds

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given NDIS remaining $14,880, when $1,000 is added to NDIS, then the NDIS card shows $15,880 and History's first row shows '+$1,000'. | NOT MET |
| AC-02 | US-01 | validation | Given amount '-50', when submitted, then a validation error is shown and nothing is saved. | NOT MET |
| AC-03 | US-01 | permission | Given a user without fund-edit rights (per OQ-05), when they call the action, then it is rejected. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
