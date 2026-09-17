# Data Model — F0-11 Care events, occurrence overrides and append-only completions

Status: PROPOSED (validate against ARCHITECTURE.md and existing migrations before implementing).

| Table | Key columns | Notes |
|---|---|---|
| care_events | id uuid pk, client_id fk, title text, description text, starts_at timestamptz, duration_minutes int, recurrence jsonb null, recurrence_until date null, is_active bool, created_by fk, created_at, updated_at | 'Event' in designs = 'Care Need Item' in client brief. Title/time fields pending OQ-22. |
| care_event_overrides | id, event_id fk, original_start timestamptz, kind text check in ('cancelled','modified'), new_starts_at null, new_duration_minutes null, created_by, created_at; unique(event_id, original_start) | |
| care_event_completions | id, event_id fk, original_start timestamptz, action text ('done'/'undone'), actor_id fk, actor_display_name text, organisation_id null, occurred_at timestamptz | Append-only (TM-0409). |


Rules: every table has RLS enabled in the same migration; money uses numeric(12,2); timestamps are timestamptz; audit trigger attached (F0-08 pattern).
