-- INT-07. Run against local Supabase only after seed-scale.ts.
-- psql variable family_id is the scale family's synthetic profile UUID.
-- These are read-only plans under the same authenticated family RLS as the app.
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'family_id', 'role', 'authenticated', 'aal', 'aal1')::text, true) as claims \gset
\echo CARE_EVENTS_WEEK
explain (analyze, buffers, format json)
select id, client_id, title, description, starts_at, duration_minutes, recurrence,
       recurrence_until, completion_mode, is_active, deactivated_at, created_at
from care_events
where client_id = '07100000-0000-4000-8000-000000000001'
  and starts_at < '2026-10-05T00:00:00+11:00';
\echo OVERRIDES_WEEK
explain (analyze, buffers, format json)
select event_id, original_start, kind, new_starts_at, new_duration_minutes, new_completion_mode
from care_event_overrides
where client_id = '07100000-0000-4000-8000-000000000001'
  and original_start >= '2026-09-28T00:00:00+10:00'
  and original_start < '2026-10-05T00:00:00+11:00';
\echo COMPLETIONS_WEEK
explain (analyze, buffers, format json)
select event_id, original_start, action, actor_display_name, occurred_at, seq
from care_event_completions
where client_id = '07100000-0000-4000-8000-000000000001'
  and original_start >= '2026-09-28T00:00:00+10:00'
  and original_start < '2026-10-05T00:00:00+11:00'
order by seq;
\echo SHIFT_CARERS_WEEK
explain (analyze, buffers, format json)
select * from client_shift_carers('07100000-0000-4000-8000-000000000001', '2026-09-28T00:00:00+10:00', '2026-10-05T00:00:00+11:00');
rollback;
\echo EXISTING_INDEXES
select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename in ('care_events', 'care_event_overrides', 'care_event_completions', 'shifts', 'client_family_members')
order by tablename, indexname;
