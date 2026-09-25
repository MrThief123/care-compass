# Acceptance Criteria — F0-08 Append-only audit log capture

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Helen updates Margaret's client row, when the update commits, then one audit_log row exists with action UPDATE, actor_id = Helen, and before/after values. | MET |
| AC-02 | US-01 | permission | Given any authenticated user, when they attempt UPDATE or DELETE on audit_log, then the statement is rejected. | MET |
| AC-03 | US-01 | edge | Given a change executed with the service role, when it commits, then the audit row has actor_role 'system'. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
