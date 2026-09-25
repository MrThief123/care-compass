# Data Model — F0-11 Care events, occurrence overrides and append-only completions

Status: IMPLEMENTED (`supabase/migrations/20260925030000_care_events.sql`; see DECISIONS.md FD-05 for what differs from the proposal).

| Table | Key columns | Notes |
|---|---|---|
| care_events | id uuid pk, client_id fk (cascade), title, description, starts_at timestamptz (whole second), duration_minutes, recurrence jsonb null (`{frequency: daily\|weekly\|monthly\|yearly, interval >= 1}`), recurrence_until date null, completion_mode ('manual' task \| 'automatic' plain event), is_active, deactivated_at, created_by (default auth.uid(), set null on profile delete), created_at, updated_at | 'Event' in designs = 'Care Need Item' in the client brief. `client_id` is immutable. Fortnightly is weekly/2, quarterly monthly/3 (PD-046). |
| care_event_overrides | id, event_id fk (cascade), client_id (derived from the event), original_start (whole second), kind ('cancelled' \| 'modified'), new_starts_at, new_duration_minutes, new_completion_mode, created_by, created_at; unique(event_id, original_start) | One exception per occurrence. A 'modified' row must change something. `new_completion_mode` makes one occurrence a task or a plain event (CHG-009). |
| care_event_completions | id, seq (identity: insertion order), event_id fk (restrict), client_id fk (restrict), original_start (whole second), action ('done' \| 'undone'), actor_id (no FK), actor_display_name snapshot (full name, PD-038), organisation_id snapshot (no FK), occurred_at | Append-only for everyone, the table owner and the service role included (trigger). Written only by `set_occurrence_done` / `set_occurrence_undone`. |

Functions (all SECURITY DEFINER, fixed search path, execute for `authenticated` only): `set_occurrence_done`, `set_occurrence_undone`, `client_shift_carers` (who is on shift, for the assignee), `can_read_care_events`, `can_edit_care_events`.

Rules: every table has RLS enabled in the same migration; timestamps are timestamptz; every table has the F0-08 audit trigger; nobody can delete an event, an override or a completion.
