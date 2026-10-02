-- [ADM-08] Admin — Manage carer-client assignments
-- Covers AC-01, AC-02, AC-03 (docs/development/admin-dev/admin-carer-assignments/ACCEPTANCE_CRITERIA.md)
-- for admin_end_carer_assignment(p_carer_id, p_client_id) returns integer: ends a carer's access to
-- one client by cancelling their future shifts with that client and ending the one in progress
-- (PD-041: access is derived from shifts, there is no assignment table). Returns how many shifts
-- it changed.
begin;
select plan(22);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'daniel@example.com'),
  ('a7777777-7777-7777-7777-777777777777', 'bea@example.com');

-- Helen (family, Margaret), Priya (admin, Banksia), Aisha and Daniel (carers, Banksia),
-- Wendy (admin, Wattle), Bea (carer, Wattle)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a5555555-5555-5555-5555-555555555555', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Kelly', true),
  ('a7777777-7777-7777-7777-777777777777', 'carer', '22222222-2222-2222-2222-222222222222', 'Bea', 'Other', true);

-- Margaret, Elsie and Nell at Banksia
insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Doyle', '1945-03-01'),
  ('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Nell', 'Ford', '1938-01-01'),
  ('b4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Elsie', 'Marsh', '1941-07-09');

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter');

-- Aisha with Margaret: 2 in the future, 1 in progress, 1 finished, 1 already cancelled (future).
-- Aisha with Elsie: 1 in the future (the whole of her access to Elsie).
-- Aisha with Nell: 1 in the future (must survive). Daniel with Margaret: 1 in the future (must survive).
insert into shifts (id, client_id, carer_id, starts_at, ends_at, cancelled_at) values
  ('d0000001-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('d0000001-0000-0000-0000-000000000002', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '2 days', now() + interval '2 days 4 hours', null),
  ('d0000001-0000-0000-0000-000000000003', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour', null),
  ('d0000001-0000-0000-0000-000000000004', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '2 days', now() - interval '2 days' + interval '4 hours', null),
  ('d0000001-0000-0000-0000-000000000005', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '4 days', now() + interval '4 days 4 hours', now() - interval '1 day'),
  ('d0000004-0000-0000-0000-000000000001', 'b4444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('d0000003-0000-0000-0000-000000000001', 'b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('d0000005-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', now() + interval '1 day', now() + interval '1 day 4 hours', null);

create or replace function pg_temp.login(p_user_id uuid, p_aal text default 'aal2') returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- Remember the rows that must not change.
create temp table before_rows as
select id, starts_at, ends_at, cancelled_at from shifts;
grant select on before_rows to authenticated;

-- ---------------------------------------------------------------------------
-- AC-03 Permissions: only an admin of the client's organisation, at AAL2, who also administers
-- the carer's organisation, can end an assignment. Every refusal changes nothing.
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ select admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'AC-03: Aisha (the carer herself) is refused'
);

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select throws_ok(
  $$ select admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'AC-03: Daniel (another carer, same organisation) is refused'
);

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ select admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'AC-03: Helen (family of the client) is refused'
);

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select throws_ok(
  $$ select admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'AC-03: Wendy (admin of another organisation) is refused'
);

select pg_temp.login('a2222222-2222-2222-2222-222222222222', 'aal1');
select throws_ok(
  $$ select admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'AC-03: Priya without MFA (AAL1) is refused'
);

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ select admin_end_carer_assignment('a7777777-7777-7777-7777-777777777777', 'b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'AC-03: Priya naming a carer from another organisation is refused'
);

reset role;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok(
  $$ select admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'AC-03: a caller with no session is refused'
);
reset role;

select is(
  (select count(*)::int from shifts s join before_rows b using (id)
    where s.starts_at is distinct from b.starts_at
       or s.ends_at is distinct from b.ends_at
       or s.cancelled_at is distinct from b.cancelled_at),
  0,
  'AC-03: the refused calls changed no shift'
);

-- ---------------------------------------------------------------------------
-- AC-01 Aisha can see Elsie only through her shift; ending it removes the client from her view.
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from clients where id = 'b4444444-4444-4444-4444-444444444444'),
  1,
  'AC-01: before, Aisha can read Elsie'
);

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444'),
  1,
  'AC-01: Priya ends Aisha''s assignment to Elsie; one shift changed'
);

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from clients where id = 'b4444444-4444-4444-4444-444444444444'),
  0,
  'AC-01: Aisha queries Elsie and zero rows are returned'
);

-- ---------------------------------------------------------------------------
-- AC-02 Only the pair's future shifts are cancelled and its in-progress shift is ended.
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111'),
  3,
  'AC-02: Aisha and Margaret: 2 future shifts cancelled and 1 in progress ended = 3 changed'
);

reset role;
select is(
  (select count(*)::int from shifts
    where client_id = 'b1111111-1111-1111-1111-111111111111'
      and carer_id = 'a3333333-3333-3333-3333-333333333333'
      and id in ('d0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002')
      and cancelled_at is not null),
  2,
  'AC-02: both future shifts with Margaret are cancelled'
);

select ok(
  (select ends_at <= now() and cancelled_at is null from shifts where id = 'd0000001-0000-0000-0000-000000000003'),
  'AC-02: the in-progress shift now ends at or before now, so it is no longer active'
);

select is(
  (select ends_at from shifts where id = 'd0000001-0000-0000-0000-000000000004'),
  (select ends_at from before_rows where id = 'd0000001-0000-0000-0000-000000000004'),
  'AC-02: the finished shift (history) is unchanged'
);

select is(
  (select cancelled_at from shifts where id = 'd0000001-0000-0000-0000-000000000005'),
  (select cancelled_at from before_rows where id = 'd0000001-0000-0000-0000-000000000005'),
  'AC-02: the shift that was already cancelled keeps its original cancelled_at'
);

select is(
  (select count(*)::int from shifts s join before_rows b using (id)
    where s.id in ('d0000003-0000-0000-0000-000000000001', 'd0000005-0000-0000-0000-000000000001')
      and (s.ends_at is distinct from b.ends_at or s.cancelled_at is distinct from b.cancelled_at)),
  0,
  'AC-02: Aisha''s shift with Nell and Daniel''s shift with Margaret are untouched'
);

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  'AC-02: Aisha can no longer read Margaret'
);
select is(
  (select count(*)::int from clients where id = 'b3333333-3333-3333-3333-333333333333'),
  1,
  'AC-02: Aisha can still read Nell'
);

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  1,
  'AC-02: Daniel can still read Margaret'
);

-- Ending an assignment that is already ended is harmless.
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111'),
  0,
  'AC-02: ending it again changes nothing and returns 0'
);

-- Bad input by the right person is refused.
select throws_ok(
  $$ select admin_end_carer_assignment('a3333333-3333-3333-3333-333333333333', null) $$,
  '22023', null,
  'a null client is refused'
);

select * from finish();
rollback;
