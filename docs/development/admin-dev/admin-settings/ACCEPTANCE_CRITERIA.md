# Acceptance Criteria — ADM-10 Admin — Settings

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given seed data, when Settings renders, then 'Banksia Home Care', '54 123 456 789', '03 9555 0102', '220 High St, Preston VIC 3072' are shown. | NOT MET |
| AC-02 | US-01 | validation | Given ABN '123', when saved, then an ABN error is shown. | NOT MET |
| AC-03 | US-01 | permission | Given Priya, when she updates another organisation, then RLS rejects it. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
