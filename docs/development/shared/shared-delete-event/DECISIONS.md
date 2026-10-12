# Decisions — F0-27
- FD-01 No new table or policy: reuse `care_event_overrides` (cancelled) and `recurrence_until` / `is_active`, both already read by the occurrence builder. Existing RLS (family, carer on shift) already matches who may delete.
- FD-02 Past history is kept (human request: "this event or all future events").
- FD-03 Provisional ID F0-27; DEVELOPMENT_PLAN row and CHG entry await human confirmation (§9).
