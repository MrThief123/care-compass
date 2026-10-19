# Decisions — F0-27
- FD-01 No new table or policy: reuse `care_event_overrides` (cancelled) and `recurrence_until` / `is_active`, both already read by the occurrence builder. Existing RLS (family, carer on shift) already matches who may delete.
- FD-02 Past history is kept (human request: "this event or all future events").
- FD-03 Provisional ID F0-27; DEVELOPMENT_PLAN row and CHG entry await human confirmation (§9).
- FD-04 (2026-10-14, the human owner, via FAM-18 PR #243): `deleteEvent` refuses a Done occurrence with "Completed care can't be deleted." (latest `care_event_completions` row; the mock checks the row's status), so completed care is never hidden. FAM-18's Task detail Delete calls this action too (FAM-18 FD-10).
