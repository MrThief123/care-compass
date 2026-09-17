# Acceptance Criteria — CAR-04 Carer — Client info

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Aisha is assigned but not on shift, when Margaret's info renders, then no Edit links or Add file tile exist. | NOT MET |
| AC-02 | US-01 | happy | Given Aisha is on an active shift for Margaret, when she edits Habits and saves, then the change is shown. | NOT MET |
| AC-03 | US-01 | permission | Given Aisha is not on shift, when she updates client_info_sections for Margaret directly, then RLS rejects it. | NOT MET |
| AC-04 | US-01 | permission | Given Aisha is not assigned to a client, when she opens that client's info URL, then she is redirected to Patients. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
