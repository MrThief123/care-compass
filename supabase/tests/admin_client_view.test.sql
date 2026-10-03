-- [ADM-11] Admin — Client view: an admin of the client's organisation acts as the family (PD-058).
-- Covers AC-04 and AC-05 at the database level (docs/development/admin-dev/admin-client-view/):
-- events, overrides, tick and untick (FD-01: `can_edit_care_events` and `set_occurrence_undone` gain the
-- admin), client information, documents and the budget, each naming the admin; another organisation's
-- admin and an admin below AAL2 are refused everywhere.
begin;
select plan(31);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'wendy@example.com');

-- Helen (family, Margaret), Priya (admin, Banksia), Wendy (admin, Wattle: another organisation)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true);

insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells', '1945-03-01');

insert into client_family_members (client_id, profile_id) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111');

insert into care_events (id, client_id, title, description, starts_at, duration_minutes, recurrence, completion_mode, is_active, created_by) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Morning medication', '', '2026-11-30 09:00:00+11', 15, '{"frequency":"weekly","interval":1}', 'manual', true, 'a1111111-1111-1111-1111-111111111111');

insert into budget_buckets (id, client_id, name) values
  ('c0000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'NDIS');
insert into budget_fund_entries (bucket_id, client_id, kind, amount, recorded_by, recorded_by_name)
values ('c0000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'funds_added', 1000, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');

create or replace function pg_temp.login(p_user_id uuid, p_aal text default 'aal2') returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
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
-- AC-04: Priya, admin of Margaret's organisation, does what Helen does
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');

select is((select count(*)::int from care_events), 1, '[ADM-11][AC-04] Priya reads Margaret''s events');

select lives_ok(
  $$ insert into care_events (client_id, title, starts_at, duration_minutes, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Podiatry', '2026-12-02 10:00:00+11', 30, 'a2222222-2222-2222-2222-222222222222') $$,
  '[ADM-11][AC-04] Priya can add an event');
select is(
  (select created_by from care_events where title = 'Podiatry'),
  'a2222222-2222-2222-2222-222222222222'::uuid,
  '[ADM-11][AC-04] and it names Priya as its creator');
select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Spoofed', now(), 'a1111111-1111-1111-1111-111111111111') $$,
  '42501', null, '[ADM-11][AC-04] an admin cannot record an event as someone else');
select is(
  pg_temp.rows_changed($$ update care_events set title = 'Podiatry (moved)' where title = 'Podiatry' $$),
  1, '[ADM-11][AC-04] Priya can edit an event');
select lives_ok(
  $$ insert into care_event_overrides (event_id, original_start, kind, created_by) values ('e1111111-1111-1111-1111-111111111111', '2026-12-07 09:00:00+11', 'cancelled', 'a2222222-2222-2222-2222-222222222222') $$,
  '[ADM-11][AC-04] Priya can change one occurrence of a series');

select lives_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-11-30 09:00:00+11') $$,
  '[ADM-11][AC-04] Priya can mark a task done');
select is(
  (select actor_display_name from care_event_completions where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-11-30 09:00:00+11' and action = 'done'),
  'Priya Nair',
  '[ADM-11][AC-04] and the Care log reads "Done by Priya Nair"');
select lives_ok(
  $$ select set_occurrence_undone('e1111111-1111-1111-1111-111111111111', '2026-11-30 09:00:00+11') $$,
  '[ADM-11][AC-04] Priya can undo her own tick');

reset role;
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-14 09:00:00+11') $$,
  '[ADM-11][AC-04] Helen ticks another occurrence');
reset role;
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select lives_ok(
  $$ select set_occurrence_undone('e1111111-1111-1111-1111-111111111111', '2026-12-14 09:00:00+11') $$,
  '[ADM-11][AC-04] Priya can undo someone else''s tick, as the family can');
select is(
  (select action from care_event_completions where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-12-14 09:00:00+11' order by seq desc limit 1),
  'undone',
  '[ADM-11][AC-04] and the latest entry is an untick');

select lives_ok(
  $$ insert into client_info_sections (client_id, key, body, updated_by) values ('b1111111-1111-1111-1111-111111111111', 'habits', 'Prefers tea.', 'a2222222-2222-2222-2222-222222222222') $$,
  '[ADM-11][AC-04] Priya can edit client information');
select lives_ok(
  $$ insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by) values ('b1111111-1111-1111-1111-111111111111', 'clients/b1111111-1111-1111-1111-111111111111/d1/Plan.pdf', 'Plan.pdf', 'application/pdf', 1000, 'a2222222-2222-2222-2222-222222222222') $$,
  '[ADM-11][AC-04] Priya can add a document');
select lives_ok(
  $$ select add_funds('c0000000-0000-0000-0000-000000000001', 500) $$,
  '[ADM-11][AC-03] Priya can add $500 to NDIS');
select is(
  (select recorded_by_name from budget_fund_entries where bucket_id = 'c0000000-0000-0000-0000-000000000001' order by seq desc limit 1),
  'Priya Nair',
  '[ADM-11][AC-03] and History reads "Recorded by Priya Nair"');

-- ---------------------------------------------------------------------------
-- AC-05: Wendy, admin of another organisation, reads and changes nothing
-- ---------------------------------------------------------------------------
reset role;
select pg_temp.login('a3333333-3333-3333-3333-333333333333');

select is((select count(*)::int from clients), 0, '[ADM-11][AC-05] Wendy cannot read Margaret');
select is((select count(*)::int from care_events), 0, '[ADM-11][AC-05] nor her events');
select is((select count(*)::int from budget_buckets), 0, '[ADM-11][AC-05] nor her budget');
select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Intruder', now(), 'a3333333-3333-3333-3333-333333333333') $$,
  '42501', null, '[ADM-11][AC-05] Wendy cannot add an event');
select is(
  pg_temp.rows_changed($$ update care_events set title = 'Hijacked' $$),
  0, '[ADM-11][AC-05] Wendy cannot edit an event');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-21 09:00:00+11') $$,
  '42501', null, '[ADM-11][AC-05] Wendy cannot tick a task');
select throws_ok(
  $$ select set_occurrence_undone('e1111111-1111-1111-1111-111111111111', '2026-12-14 09:00:00+11') $$,
  '42501', null, '[ADM-11][AC-05] Wendy cannot untick one');
select throws_ok(
  $$ insert into client_info_sections (client_id, key, body, updated_by) values ('b1111111-1111-1111-1111-111111111111', 'description', 'x', 'a3333333-3333-3333-3333-333333333333') $$,
  '42501', null, '[ADM-11][AC-05] Wendy cannot edit client information');
select throws_ok(
  $$ insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by) values ('b1111111-1111-1111-1111-111111111111', 'clients/b1111111-1111-1111-1111-111111111111/d2/x.pdf', 'x.pdf', 'application/pdf', 1, 'a3333333-3333-3333-3333-333333333333') $$,
  '42501', null, '[ADM-11][AC-05] Wendy cannot add a document');
select throws_ok(
  $$ select add_funds('c0000000-0000-0000-0000-000000000001', 1) $$,
  '42501', null, '[ADM-11][AC-05] Wendy cannot change the budget');

-- ---------------------------------------------------------------------------
-- AC-05: Priya below AAL2 (password only) has no admin authority (F0-21)
-- ---------------------------------------------------------------------------
reset role;
select pg_temp.login('a2222222-2222-2222-2222-222222222222', 'aal1');

select is((select count(*)::int from care_events), 0, '[ADM-11][AC-05] an admin at AAL1 reads no events');
select throws_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'No second factor', now(), 'a2222222-2222-2222-2222-222222222222') $$,
  '42501', null, '[ADM-11][AC-05] an admin at AAL1 cannot add an event');
select throws_ok(
  $$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-21 09:00:00+11') $$,
  '42501', null, '[ADM-11][AC-05] an admin at AAL1 cannot tick a task');

-- ---------------------------------------------------------------------------
-- Family is unchanged
-- ---------------------------------------------------------------------------
reset role;
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ insert into care_events (client_id, title, starts_at, created_by) values ('b1111111-1111-1111-1111-111111111111', 'Family event', date_trunc('second', now()), 'a1111111-1111-1111-1111-111111111111') $$,
  '[ADM-11][AC-02] Helen can still add an event');
select is((select count(*)::int from care_events where title = 'Family event'), 1, '[ADM-11][AC-02] and see it');

select * from finish();
rollback;
