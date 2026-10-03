-- [ADM-05] Admin — Remove client
-- Covers AC-01, AC-02, AC-03, AC-04 and the database half of AC-07
-- (docs/development/admin-dev/admin-client-remove/ACCEPTANCE_CRITERIA.md) for
-- admin_remove_client(p_client_id) returns void: detaches the client from the admin's organisation
-- (organisation_id null, organisation_removed_at set), cancels its future shifts and ends the one in
-- progress now. Nothing is deleted; the family keeps everything (FD-01, FD-02, FD-03).
begin;
select plan(32);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'tom@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'sam@example.com');

-- Tom (family, Doris), Priya (admin, Banksia), Aisha (carer, Banksia), Wendy (admin, Wattle),
-- Sam (family, a client who signed up with no organisation)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Tom', 'Petrov', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a5555555-5555-5555-5555-555555555555', 'family', null, 'Sam', 'Lee', true);

-- Doris (to be removed), Nell (stays) at Banksia; Pat has no organisation and never had one
insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Doris', 'Petrov', '1940-03-01'),
  ('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Nell', 'Ford', '1938-01-01'),
  ('b5555555-5555-5555-5555-555555555555', null, 'Pat', 'Lee', '1950-05-05');

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Son'),
  ('b5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'Daughter');

-- Aisha with Doris: 2 future, 1 in progress, 1 finished, 1 future already cancelled. With Nell: 1 future.
insert into shifts (id, client_id, carer_id, starts_at, ends_at, cancelled_at) values
  ('d0000001-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('d0000001-0000-0000-0000-000000000002', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '2 days', now() + interval '2 days 4 hours', null),
  ('d0000001-0000-0000-0000-000000000003', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour', null),
  ('d0000001-0000-0000-0000-000000000004', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '2 days', now() - interval '2 days' + interval '4 hours', null),
  ('d0000001-0000-0000-0000-000000000005', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '4 days', now() + interval '4 days 4 hours', now() - interval '1 day'),
  ('d0000003-0000-0000-0000-000000000001', 'b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null);

-- What the family and the records must keep: two events, a completion, a budget bucket
insert into care_events (id, client_id, title, starts_at) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Morning medication', '2026-09-01 09:00:00+10'),
  ('e2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Physiotherapy', '2026-09-02 10:00:00+10');
insert into care_event_completions (event_id, client_id, original_start, action, actor_id, actor_display_name, organisation_id) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '2026-09-01 09:00:00+10', 'done',
   'a3333333-3333-3333-3333-333333333333', 'Aisha Rahman', '11111111-1111-1111-1111-111111111111');
insert into budget_buckets (id, client_id, name) values
  ('c0000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'Core supports');

create or replace function pg_temp.login(p_user_id uuid, p_aal text default 'aal2') returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

create temp table before_rows as
select id, starts_at, ends_at, cancelled_at from shifts;
grant select on before_rows to authenticated;

-- ---------------------------------------------------------------------------
-- AC-04 Permissions. Every refusal changes nothing.
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ select admin_remove_client('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'AC-04: Aisha (a carer of the organisation) is refused');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ select admin_remove_client('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'AC-04: Tom (the client''s own family) is refused: only the admin can remove');

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select throws_ok(
  $$ select admin_remove_client('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'AC-04: Wendy (admin of another organisation) is refused');

select pg_temp.login('a2222222-2222-2222-2222-222222222222', 'aal1');
select throws_ok(
  $$ select admin_remove_client('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'AC-04: Priya without MFA (AAL1) is refused');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ select admin_remove_client('b9999999-9999-9999-9999-999999999999') $$,
  '42501', null, 'AC-04: Priya naming an unknown client is refused');

select throws_ok(
  $$ select admin_remove_client('b5555555-5555-5555-5555-555555555555') $$,
  '42501', null, 'AC-04: Priya naming a client with no organisation is refused');

reset role;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok(
  $$ select admin_remove_client('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'AC-04: a caller with no session is refused');
reset role;

select is(
  (select count(*)::int from shifts s join before_rows b using (id)
    where s.starts_at is distinct from b.starts_at
       or s.ends_at is distinct from b.ends_at
       or s.cancelled_at is distinct from b.cancelled_at)
  + (select count(*)::int from clients
      where organisation_removed_at is not null
         or (id = 'b1111111-1111-1111-1111-111111111111'
             and organisation_id is distinct from '11111111-1111-1111-1111-111111111111')),
  0,
  'AC-04: the refused calls changed no shift and removed nobody'
);

-- ---------------------------------------------------------------------------
-- AC-07 (family-created client): never removed, so no marker.
-- ---------------------------------------------------------------------------
select is(
  (select organisation_removed_at from clients where id = 'b5555555-5555-5555-5555-555555555555'),
  null,
  'AC-07: a client who signed up with no organisation has no removal marker'
);

-- ---------------------------------------------------------------------------
-- Before: the organisation can read Doris.
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  1, 'AC-01: before, Aisha (on shift now) can read Doris');
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  1, 'AC-01: before, Priya can read Doris');

-- ---------------------------------------------------------------------------
-- Priya removes Doris.
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ select admin_remove_client('b1111111-1111-1111-1111-111111111111') $$,
  'AC-03: Priya removes Doris');

-- AC-01 / AC-04: the organisation reads nothing afterwards
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  0, 'AC-01: Aisha queries Doris and zero rows are returned');
select is(
  (select count(*)::int from care_events where client_id = 'b1111111-1111-1111-1111-111111111111'),
  0, 'AC-01: Aisha reads none of Doris''s events');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  0, 'AC-04: Priya queries Doris afterwards and zero rows are returned');
select is(
  (select count(*)::int from clients where id = 'b3333333-3333-3333-3333-333333333333'),
  1, 'AC-04: Priya still reads Nell');

-- AC-02: Tom keeps everything
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from care_events where client_id = 'b1111111-1111-1111-1111-111111111111'),
  2, 'AC-02: Tom queries Doris''s events and all of them are returned');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  1, 'AC-02: Tom still reads Doris');
select is(
  (select count(*)::int from budget_buckets where client_id = 'b1111111-1111-1111-1111-111111111111'),
  1, 'AC-02: Tom still reads her budget');
select is(
  (select count(*)::int from care_event_completions where client_id = 'b1111111-1111-1111-1111-111111111111'),
  1, 'AC-02: Tom still reads her completions');

-- AC-04: removing twice is refused (the admin no longer has access to the client)
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ select admin_remove_client('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'AC-04: removing an already removed client is refused');

-- ---------------------------------------------------------------------------
-- AC-03 What changed and what did not
-- ---------------------------------------------------------------------------
reset role;
select ok(
  (select organisation_id is null and organisation_removed_at is not null and organisation_removed_at <= now()
     from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  'AC-03: Doris is kept with no organisation and a removal time');

select is(
  (select count(*)::int from shifts
    where id in ('d0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002')
      and cancelled_at is not null),
  2, 'AC-03: her two future shifts are cancelled');

select ok(
  (select ends_at <= now() and cancelled_at is null from shifts where id = 'd0000001-0000-0000-0000-000000000003'),
  'AC-03: the shift in progress now ends at or before now');

select is(
  (select ends_at from shifts where id = 'd0000001-0000-0000-0000-000000000004'),
  (select ends_at from before_rows where id = 'd0000001-0000-0000-0000-000000000004'),
  'AC-03: the finished shift (history) is unchanged');

select is(
  (select cancelled_at from shifts where id = 'd0000001-0000-0000-0000-000000000005'),
  (select cancelled_at from before_rows where id = 'd0000001-0000-0000-0000-000000000005'),
  'AC-03: the shift that was already cancelled keeps its original cancelled_at');

select is(
  (select count(*)::int from shifts s join before_rows b using (id)
    where s.id = 'd0000003-0000-0000-0000-000000000001'
      and (s.ends_at is distinct from b.ends_at or s.cancelled_at is distinct from b.cancelled_at)),
  0, 'AC-03: Nell''s shift is untouched');

select is(
  (select count(*)::int from care_events where client_id = 'b1111111-1111-1111-1111-111111111111')
  + (select count(*)::int from care_event_completions where client_id = 'b1111111-1111-1111-1111-111111111111')
  + (select count(*)::int from budget_buckets where client_id = 'b1111111-1111-1111-1111-111111111111')
  + (select count(*)::int from client_family_members where client_id = 'b1111111-1111-1111-1111-111111111111'),
  5, 'AC-03: events (2), completion (1), budget bucket (1) and family link (1) are all kept');

-- ---------------------------------------------------------------------------
-- AC-07 The family moves Doris to a new organisation: the marker clears.
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from list_organisations_for_transfer('b1111111-1111-1111-1111-111111111111')
    where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')),
  2, 'AC-07: with no organisation, Tom is still offered both organisations');
select is(
  (select count(*)::int from list_organisations_for_transfer('b1111111-1111-1111-1111-111111111111') where is_current),
  0, 'AC-07: and none is marked current');
select lives_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  'AC-07: Tom moves Doris to Wattle Care');
reset role;
select ok(
  (select organisation_id = '22222222-2222-2222-2222-222222222222' and organisation_removed_at is null
     from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  'AC-07: Doris is with Wattle Care and the removal marker is cleared');

select * from finish();
rollback;
