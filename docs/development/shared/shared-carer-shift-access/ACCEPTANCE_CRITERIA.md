# Acceptance Criteria — F0-18 Carer view access derived from shifts

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a carer whose only shift with a client is 09:00–15:00 today, when it is 08:00, then the carer can read the client and cannot edit. | NOT MET |
| AC-02 | US-01 | happy | Given the same shift, when it is 09:00 (and any time before 15:00), then the carer can read and edit. | NOT MET |
| AC-03 | US-01 | happy | Given the same shift and a later shift with the same client, when it is 15:00 or after, then the carer can read and cannot edit. | NOT MET |
| AC-04 | US-01 | security | Given the same shift and no later shift with that client, when it is 15:00 or after, then the carer cannot read the client or its events. | NOT MET |
| AC-05 | US-01 | security | Given a shift scheduled weeks ahead, when it is created, then the carer can read the client from that moment. | NOT MET |
| AC-06 | US-01 | security | Given a carer whose only shift with the client is cancelled, or a deactivated carer, then the carer cannot read the client. | NOT MET |
| AC-07 | US-01 | security | Given a carer with shifts only with another client, then the carer cannot read this client. | NOT MET |
| AC-08 | US-01 | happy | Given a client transferred to another organisation, then the old organisation's carers lose read access (their future shifts were cancelled by the transfer). | NOT MET |
| AC-09 | US-01 | happy | Given the migration has run, then `carer_client_assignments` no longer exists and ARCHITECTURE.md describes the shift-derived rule. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
