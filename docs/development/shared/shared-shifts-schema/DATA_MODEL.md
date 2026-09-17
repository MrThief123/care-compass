# Data Model — F0-10 Shifts schema, active-shift function and conflict query

Status: PROPOSED (validate against ARCHITECTURE.md and existing migrations before implementing).

| Table | Key columns | Notes |
|---|---|---|
| shifts | id uuid pk, organisation_id fk, client_id fk, carer_id fk profiles, starts_at timestamptz, ends_at timestamptz, created_by fk, created_at, cancelled_at null | No recurrence (UI-D31). Future shifts cleared on organisation transfer (UI-D24). |


Rules: every table has RLS enabled in the same migration; money uses numeric(12,2); timestamps are timestamptz; audit trigger attached (F0-08 pattern).
