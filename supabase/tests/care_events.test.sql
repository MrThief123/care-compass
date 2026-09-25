-- [F0-11] Care events, occurrence overrides and append-only completions
-- Covers AC-04 to AC-08 at the database level (docs/development/shared/shared-care-events-schema/ACCEPTANCE_CRITERIA.md),
-- plus the CHG-001 / CHG-009 rules: plain events cannot be ticked off, per-occurrence mode overrides,
-- and OQ-10 undo. AC-01 to AC-03 and AC-08 (occurrence listing, status) are TypeScript, tested elsewhere.
begin;
select plan(68);

-- ---------------------------------------------------------------------------
-- Seed: two organisations, five people, three clients, shifts, events
-- ---------------------------------------------------------------------------
insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'bea@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'cara@example.com'),
  ('a6666666-6666-6666-6666-666666666666', 'rosa@example.com'),
  ('a7777777-7777-7777-7777-777777777777', 'dan@example.com');

-- Helen (family, Margaret), Priya (admin, Banksia), Aisha (carer, on shift now), Bea (carer, assigned,
-- shift only tomorrow), Cara (carer, current shift cancelled), Rosa (family, Robert), Dan (carer, no assignment)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'carer', '11111111-1111-1111-1111-111111111111', 'Bea', 'Ng', true),
  ('a5555555-5555-5555-5555-555555555555', 'carer', '11111111-1111-1111-1111-111111111111', 'Cara', 'Lee', true),
  ('a6666666-6666-6666-6666-666666666666', 'family', null, 'Rosa', 'Doyle', true),
  ('a7777777-7777-7777-7777-777777777777', 'carer', '11111111-1111-1111-1111-111111111111', 'Dan', 'Wu', true);

insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells', '1945-03-01'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Robert', 'Doyle', '1950-05-05');

insert into client_family_members (client_id, profile_id) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b2222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666');

insert into carer_client_assignments (carer_id, client_id, organisation_id, started_at) values
  ('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() - interval '3 days'),
  ('a4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() - interval '3 days'),
  ('a5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() - interval '3 days');

insert into shifts (client_id, carer_id, starts_at, ends_at, cancelled_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour', null),
  ('b1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('b1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', now() - interval '1 hour', now() + interval '1 hour', now() - interval '2 hours');

-- Events (inserted as the table owner; RLS is exercised below)
--   e1 Morning medication: weekly task (manual) for Margaret
--   e2 Afternoon walk: plain event (automatic) for Margaret
--   e3 Eye drops: task for Margaret, deactivated
--   e4 Robert's medication: task for Robert
insert into care_events (id, client_id, title, description, starts_at, duration_minutes, recurrence, completion_mode, is_active, created_by) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Morning medication', '', '2026-11-30 09:00:00+11', 15, '{"frequency":"weekly","interval":1}', 'manual', true, 'a1111111-1111-1111-1111-111111111111'),
  ('e2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Afternoon walk', '', '2026-11-30 14:00:00+11', 30, '{"frequency":"daily","interval":1}', 'automatic', true, 'a1111111-1111-1111-1111-111111111111'),
  ('e3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Eye drops', '', '2026-11-30 20:00:00+11', 5, null, 'manual', false, 'a1111111-1111-1111-1111-111111111111'),
  ('e4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 'Robert medication', '', '2026-11-30 08:00:00+11', 15, null, 'manual', true, 'a6666666-6666-6666-6666-666666666666');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

create or replace function pg_temp.rows_changed(p_sql text) returns int as $$
declare
  n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, recurrence, created_by) values ('b1111111-1111-1111-1111-111111111111', 'x', now(), '{"frequency":"hourly","interval":1}', 'a1111111-1111-1111-1111-111111111111') $$,
  '23514', null, 'a recurrence with an unknown frequency is rejected');

select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, recurrence, created_by) values ('b1111111-1111-1111-1111-111111111111', 'x', now(), '{"frequency":"weekly","interval":0}', 'a1111111-1111-1111-1111-111111111111') $$,
  '23514', null, 'a recurrence with an interval below 1 is rejected');

select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, completion_mode, created_by) values ('b1111111-1111-1111-1111-111111111111', 'x', now(), 'sometimes', 'a1111111-1111-1111-1111-111111111111') $$,
  '23514', null, 'a completion mode other than manual or automatic is rejected');

select throws_ok(
  $$ update care_events set client_id = 'b2222222-2222-2222-2222-222222222222' where id = 'e1111111-1111-1111-1111-111111111111' $$,
  '22023', null, 'an event cannot be moved to another client');

select throws_ok(
  $$ insert into care_event_overrides (event_id, original_start, kind, created_by) values ('e1111111-1111-1111-1111-111111111111', '2026-12-07 09:00:00+11', 'modified', 'a1111111-1111-1111-1111-111111111111') $$,
  '23514', null, 'a modified override that changes nothing is rejected');

select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'x', '2026-11-30 09:00:00.5+11', 'a1111111-1111-1111-1111-111111111111') $$,
  '23514', null, 'an event start must be a whole second: an occurrence is identified by its start');

insert into care_event_overrides (event_id, original_start, kind, created_by) values
  ('e1111111-1111-1111-1111-111111111111', '2026-12-14 09:00:00+11', 'cancelled', 'a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ insert into care_event_overrides (event_id, original_start, kind, created_by) values ('e1111111-1111-1111-1111-111111111111', '2026-12-14 09:00:00+11', 'cancelled', 'a1111111-1111-1111-1111-111111111111') $$,
  '23505', null, 'an occurrence has at most one override');

select is(
  (select client_id from care_event_overrides where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-12-14 09:00:00+11'),
  'b1111111-1111-1111-1111-111111111111'::uuid,
  'an override takes its client from the event, not from the caller');

-- ---------------------------------------------------------------------------
-- Reading (AC-07 and who may see what)
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is((select count(*)::int from care_events), 3, 'Helen sees Margaret''s three events (including the deactivated one)');
select is((select count(*)::int from care_event_overrides), 1, 'Helen sees Margaret''s override');

select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select is((select count(*)::int from care_events where client_id = 'b1111111-1111-1111-1111-111111111111'), 0,
  'AC-07: Robert''s family member selecting Margaret''s events returns zero rows');
select is((select count(*)::int from care_events), 1, 'Rosa sees only Robert''s event');
select is((select count(*)::int from care_event_overrides), 0, 'AC-07: Rosa sees none of Margaret''s overrides');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is((select count(*)::int from care_events), 3, 'Aisha (assigned carer) can read Margaret''s events');

select pg_temp.login('a7777777-7777-7777-7777-777777777777');
select is((select count(*)::int from care_events), 0, 'Dan (carer with no assignment) sees no events');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is((select count(*)::int from care_events), 3, 'Priya (admin of Margaret''s organisation) can read the events');

-- ---------------------------------------------------------------------------
-- Writing events
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Physio', '2026-12-01 11:00:00+11', 'a1111111-1111-1111-1111-111111111111') $$,
  'Helen can create an event for Margaret');
select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b2222222-2222-2222-2222-222222222222', 'Sneaky', now(), 'a1111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'Helen cannot create an event for Robert');
select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Forged', now(), 'a2222222-2222-2222-2222-222222222222') $$,
  '42501', null, 'created_by must be the caller');
select is(
  pg_temp.rows_changed($$ update care_events set title = 'Morning medication (pills)' where id = 'e1111111-1111-1111-1111-111111111111' $$),
  1, 'Helen can edit her client''s event');
select throws_ok(
  $$ delete from care_events where id = 'e1111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'no one can delete an event (deactivate it instead)');

select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select is(
  pg_temp.rows_changed($$ update care_events set title = 'Hijacked' where id = 'e1111111-1111-1111-1111-111111111111' $$),
  0, 'Rosa cannot edit Margaret''s event');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select lives_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Walk', '2026-12-02 15:00:00+11', 'a3333333-3333-3333-3333-333333333333') $$,
  'Aisha (on an active shift) can create an event');

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Off shift', now(), 'a4444444-4444-4444-4444-444444444444') $$,
  '42501', null, 'Bea (assigned, but not on an active shift) cannot create an event');

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Cancelled shift', now(), 'a5555555-5555-5555-5555-555555555555') $$,
  '42501', null, 'Cara (her current shift is cancelled) cannot create an event');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Admin write', now(), 'a2222222-2222-2222-2222-222222222222') $$,
  '42501', null, 'Priya (admin) cannot create events: admin access is read only');

-- ---------------------------------------------------------------------------
-- Ticking off (AC-04, AC-05) and who may
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-11-30 09:00:00+11') $$,
  'AC-04: Helen ticks off Margaret''s morning medication');
select results_eq(
  $$ select actor_id, actor_display_name, organisation_id, action, client_id from care_event_completions where event_id = 'e1111111-1111-1111-1111-111111111111' $$,
  $$ values ('a1111111-1111-1111-1111-111111111111'::uuid, 'Helen Doyle'::text, null::uuid, 'done'::text, 'b1111111-1111-1111-1111-111111111111'::uuid) $$,
  'AC-04: one completion row, actor Helen, her name and no organisation snapshotted');

select is(
  (select id from set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-11-30 09:00:00+11')),
  (select id from care_event_completions where event_id = 'e1111111-1111-1111-1111-111111111111'),
  'ticking off an occurrence that is already Done returns the existing completion');
select is((select count(*)::int from care_event_completions where event_id = 'e1111111-1111-1111-1111-111111111111'), 1,
  'a repeated tick-off adds no second row: one effective Done');

select throws_ok(
  $$ select set_occurrence_done('e2222222-2222-2222-2222-222222222222', '2026-11-30 14:00:00+11') $$,
  '22023', null, 'a plain event cannot be ticked off');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-14 09:00:00+11') $$,
  '22023', null, 'a cancelled occurrence cannot be ticked off');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-11-29 09:00:00+11') $$,
  '22023', null, 'an occurrence before the event''s first one cannot be ticked off');
select throws_ok(
  $$ select set_occurrence_done('99999999-9999-9999-9999-999999999999', '2026-11-30 09:00:00+11') $$,
  'P0002', null, 'an event that does not exist is refused');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-28 09:00:00.5+11') $$,
  '23514', null, 'an occurrence start must be a whole second');
select throws_ok(
  $$ select set_occurrence_done(null, '2026-11-30 09:00:00+11') $$,
  '22023', null, 'a missing event id is refused');

-- Per-occurrence mode overrides (CHG-009)
reset role;
insert into care_event_overrides (event_id, original_start, kind, new_completion_mode, created_by) values
  ('e2222222-2222-2222-2222-222222222222', '2026-12-01 14:00:00+11', 'modified', 'manual', 'a1111111-1111-1111-1111-111111111111'),
  ('e1111111-1111-1111-1111-111111111111', '2026-12-07 09:00:00+11', 'modified', 'automatic', 'a1111111-1111-1111-1111-111111111111');
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select set_occurrence_done('e2222222-2222-2222-2222-222222222222', '2026-12-01 14:00:00+11') $$,
  'one occurrence of a plain event made a task by an override can be ticked off');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-07 09:00:00+11') $$,
  '22023', null, 'one occurrence of a task made a plain event by an override cannot be ticked off');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select lives_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-21 09:00:00+11') $$,
  'Aisha (on an active shift) can tick off an occurrence');
select results_eq(
  $$ select actor_display_name, organisation_id from care_event_completions where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-12-21 09:00:00+11' $$,
  $$ values ('Aisha Rahman'::text, '11111111-1111-1111-1111-111111111111'::uuid) $$,
  'her full name and her organisation are snapshotted');

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-28 09:00:00+11') $$,
  '42501', null, 'AC-05: Bea (assigned but not on an active shift) is refused');

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-28 09:00:00+11') $$,
  '42501', null, 'a carer whose current shift is cancelled is refused');

select pg_temp.login('a7777777-7777-7777-7777-777777777777');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-28 09:00:00+11') $$,
  '42501', null, 'a carer with no assignment is refused');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-28 09:00:00+11') $$,
  '42501', null, 'an admin cannot tick off');

select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-28 09:00:00+11') $$,
  '42501', null, 'another client''s family cannot tick off');

-- ---------------------------------------------------------------------------
-- Undo (OQ-10): an append-only 'undone' entry
-- ---------------------------------------------------------------------------
select pg_temp.login('a7777777-7777-7777-7777-777777777777');
select throws_ok(
  $$ select set_occurrence_undone('e1111111-1111-1111-1111-111111111111', '2026-12-21 09:00:00+11') $$,
  '42501', null, 'a carer who did not tick it off, and is not on a shift, cannot undo it');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select lives_ok(
  $$ select set_occurrence_undone('e1111111-1111-1111-1111-111111111111', '2026-12-21 09:00:00+11') $$,
  'the carer who ticked it off, still on shift, can undo it');
select results_eq(
  $$ select action from care_event_completions where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-12-21 09:00:00+11' order by seq $$,
  $$ values ('done'::text), ('undone'::text) $$,
  'undo adds an ''undone'' row; the ''done'' row is still there');
select throws_ok(
  $$ select set_occurrence_undone('e1111111-1111-1111-1111-111111111111', '2026-12-21 09:00:00+11') $$,
  '22023', null, 'undoing an occurrence that is not Done is refused');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-21 09:00:00+11') $$,
  'after an undo the occurrence can be ticked off again');

-- ---------------------------------------------------------------------------
-- Append-only (AC-06)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ update care_event_completions set action = 'undone' $$,
  '42501', null, 'AC-06: an authenticated user cannot update a completion');
select throws_ok(
  $$ delete from care_event_completions $$,
  '42501', null, 'AC-06: an authenticated user cannot delete a completion');
select throws_ok(
  $$ insert into care_event_completions (event_id, original_start, action, actor_id, actor_display_name, client_id) values ('e1111111-1111-1111-1111-111111111111', '2026-12-28 09:00:00+11', 'done', 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle', 'b1111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'a completion cannot be inserted directly, only through the function');

reset role;
select throws_ok(
  $$ update care_event_completions set actor_display_name = 'Someone Else' $$,
  '42501', null, 'AC-06: not even the table owner can update a completion');
select throws_ok(
  $$ delete from care_event_completions $$,
  '42501', null, 'AC-06: not even the table owner can delete a completion');
select throws_ok(
  $$ truncate care_event_completions $$,
  '42501', null, 'AC-06: not even the table owner can truncate the completions');

-- ---------------------------------------------------------------------------
-- A later cancellation keeps the completion in history
-- ---------------------------------------------------------------------------
insert into care_event_overrides (event_id, original_start, kind, created_by) values
  ('e1111111-1111-1111-1111-111111111111', '2026-11-30 09:00:00+11', 'cancelled', 'a1111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from care_event_completions where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-11-30 09:00:00+11'),
  1, 'cancelling an occurrence afterwards keeps its completion');

-- ---------------------------------------------------------------------------
-- Audit (F0-08)
-- ---------------------------------------------------------------------------
select results_eq(
  $$ select actor_id, actor_role, client_id from audit_log where table_name = 'care_event_completions' and action = 'INSERT' and client_id = 'b1111111-1111-1111-1111-111111111111' order by id limit 1 $$,
  $$ values ('a1111111-1111-1111-1111-111111111111'::uuid, 'family'::text, 'b1111111-1111-1111-1111-111111111111'::uuid) $$,
  'the first completion is in the audit log, with Helen as the actor and the client');
select ok(
  exists (select 1 from audit_log where table_name = 'care_events' and action = 'INSERT' and client_id = 'b1111111-1111-1111-1111-111111111111'),
  'event creation is in the audit log with the client');
select ok(
  exists (select 1 from audit_log where table_name = 'care_events' and action = 'UPDATE' and actor_id = 'a1111111-1111-1111-1111-111111111111'),
  'an event edit is in the audit log with the editor');

-- ---------------------------------------------------------------------------
-- Deactivation (AC-08): a deactivated event stops generating occurrences from that moment
-- ---------------------------------------------------------------------------
reset role;
insert into care_events (id, client_id, title, starts_at, recurrence, created_by) values
  ('e5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', 'Stretches', '2026-11-30 07:00:00+11', '{"frequency":"daily","interval":1}', 'a1111111-1111-1111-1111-111111111111');
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
update care_events set is_active = false where id = 'e5555555-5555-5555-5555-555555555555';
select ok(
  (select deactivated_at is not null and deactivated_at <= now() from care_events where id = 'e5555555-5555-5555-5555-555555555555'),
  'AC-08: deactivating an event records when');
update care_events set is_active = true where id = 'e5555555-5555-5555-5555-555555555555';
select ok(
  (select deactivated_at is null from care_events where id = 'e5555555-5555-5555-5555-555555555555'),
  'reactivating an event clears that');

-- ---------------------------------------------------------------------------
-- Who is on shift (OQ-29): a family member cannot read carer profiles, so the
-- carer's name for an occurrence comes from a function that answers readers of the client's events.
-- ---------------------------------------------------------------------------
select results_eq(
  $$ select carer_id, carer_display_name from client_shift_carers('b1111111-1111-1111-1111-111111111111', now() - interval '2 hours', now() + interval '2 hours') $$,
  $$ values ('a3333333-3333-3333-3333-333333333333'::uuid, 'Aisha Rahman'::text) $$,
  'Helen sees Aisha (full name) for a window her shift overlaps; the cancelled shift and tomorrow''s are not in it');

select is(
  (select count(*)::int from client_shift_carers('b1111111-1111-1111-1111-111111111111', now() + interval '10 days', now() + interval '11 days')),
  0, 'a window with no shift returns nothing');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from client_shift_carers('b1111111-1111-1111-1111-111111111111', now() - interval '2 hours', now() + interval '2 hours')),
  1, 'Priya (admin of the organisation) can read who is on shift');

select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select throws_ok(
  $$ select * from client_shift_carers('b1111111-1111-1111-1111-111111111111', now() - interval '2 hours', now() + interval '2 hours') $$,
  '42501', null, 'another client''s family cannot read who is on Margaret''s shifts');

select pg_temp.login('a7777777-7777-7777-7777-777777777777');
select throws_ok(
  $$ select * from client_shift_carers('b1111111-1111-1111-1111-111111111111', now() - interval '2 hours', now() + interval '2 hours') $$,
  '42501', null, 'a carer with no assignment to Margaret cannot either');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ select * from client_shift_carers('b1111111-1111-1111-1111-111111111111', null, now()) $$,
  '22023', null, 'a window without a start is refused');

select * from finish();
rollback;
