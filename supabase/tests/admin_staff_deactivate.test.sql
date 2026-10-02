-- [ADM-03] Admin — Deactivate staff
-- Covers AC-01, AC-03, AC-04, AC-05 (docs/development/admin-dev/admin-staff-deactivate/ACCEPTANCE_CRITERIA.md)
-- for admin_deactivate_staff(p_profile_id) returns profiles: sets is_active false, cancels the
-- carer's future shifts (every client) and ends the one in progress now. Nothing is deleted;
-- completions and every other carer's shifts are untouched (FD-01, FD-02).
begin;
select plan(21);

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

-- Margaret, Nell and Elsie at Banksia
insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Doyle', '1945-03-01'),
  ('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Nell', 'Ford', '1938-01-01'),
  ('b4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Elsie', 'Marsh', '1941-07-09');

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter');

-- Aisha: Margaret (2 future, 1 in progress, 1 finished, 1 future already cancelled), Elsie (1 future),
-- Nell (1 future). Daniel: Margaret (1 future) — must survive.
insert into shifts (id, client_id, carer_id, starts_at, ends_at, cancelled_at) values
  ('d0000001-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('d0000001-0000-0000-0000-000000000002', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '2 days', now() + interval '2 days 4 hours', null),
  ('d0000001-0000-0000-0000-000000000003', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour', null),
  ('d0000001-0000-0000-0000-000000000004', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '2 days', now() - interval '2 days' + interval '4 hours', null),
  ('d0000001-0000-0000-0000-000000000005', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '4 days', now() + interval '4 days 4 hours', now() - interval '1 day'),
  ('d0000004-0000-0000-0000-000000000001', 'b4444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('d0000003-0000-0000-0000-000000000001', 'b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('d0000005-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', now() + interval '1 day', now() + interval '1 day 4 hours', null);

-- Aisha ticked off a task earlier: a snapshot row that must outlive her account's access.
insert into care_events (id, client_id, title, starts_at) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Morning medication', '2026-09-01 09:00:00+10');
insert into care_event_completions (event_id, client_id, original_start, action, actor_id, actor_display_name, organisation_id) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '2026-09-01 09:00:00+10', 'done',
   'a3333333-3333-3333-3333-333333333333', 'Aisha Rahman', '11111111-1111-1111-1111-111111111111');

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
  $$ select admin_deactivate_staff('a3333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'AC-04: Aisha (the carer herself) is refused');

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select throws_ok(
  $$ select admin_deactivate_staff('a3333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'AC-04: Daniel (another carer, same organisation) is refused');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ select admin_deactivate_staff('a3333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'AC-04: Helen (family) is refused');

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select throws_ok(
  $$ select admin_deactivate_staff('a3333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'AC-04: Wendy (admin of another organisation) is refused');

select pg_temp.login('a2222222-2222-2222-2222-222222222222', 'aal1');
select throws_ok(
  $$ select admin_deactivate_staff('a3333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'AC-04: Priya without MFA (AAL1) is refused');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ select admin_deactivate_staff('a7777777-7777-7777-7777-777777777777') $$,
  '42501', null, 'AC-04: Priya naming a carer from another organisation is refused');

select throws_ok(
  $$ select admin_deactivate_staff('a2222222-2222-2222-2222-222222222222') $$,
  '42501', null, 'AC-04: Priya naming an admin (herself) is refused: only carers can be deactivated');

reset role;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok(
  $$ select admin_deactivate_staff('a3333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'AC-04: a caller with no session is refused');
reset role;

select is(
  (select count(*)::int from shifts s join before_rows b using (id)
    where s.starts_at is distinct from b.starts_at
       or s.ends_at is distinct from b.ends_at
       or s.cancelled_at is distinct from b.cancelled_at)
  + (select count(*)::int from profiles where is_active is false),
  0,
  'AC-04: the refused calls changed no shift and deactivated nobody'
);

-- ---------------------------------------------------------------------------
-- AC-01 Before, Aisha reads her three clients; after deactivation she reads none.
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is((select count(*)::int from clients), 3, 'AC-01: before, Aisha can read Margaret, Nell and Elsie');

-- ---------------------------------------------------------------------------
-- AC-03 Priya deactivates Aisha.
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select is_active from admin_deactivate_staff('a3333333-3333-3333-3333-333333333333')),
  false,
  'AC-03: Priya deactivates Aisha; the returned profile is inactive'
);

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is((select count(*)::int from clients), 0, 'AC-01: Aisha queries clients and zero rows are returned');

reset role;
select is(
  (select count(*)::int from profiles where id = 'a3333333-3333-3333-3333-333333333333' and is_active is false
     and first_name = 'Aisha' and organisation_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'AC-03: Aisha''s profile is kept, inactive'
);

select is(
  (select count(*)::int from shifts
    where carer_id = 'a3333333-3333-3333-3333-333333333333'
      and id in ('d0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002',
                 'd0000004-0000-0000-0000-000000000001', 'd0000003-0000-0000-0000-000000000001')
      and cancelled_at is not null),
  4,
  'AC-03: her four future shifts (Margaret x2, Elsie, Nell) are cancelled'
);

select ok(
  (select ends_at <= now() and cancelled_at is null from shifts where id = 'd0000001-0000-0000-0000-000000000003'),
  'AC-03: the shift in progress now ends at or before now'
);

select is(
  (select ends_at from shifts where id = 'd0000001-0000-0000-0000-000000000004'),
  (select ends_at from before_rows where id = 'd0000001-0000-0000-0000-000000000004'),
  'AC-03: the finished shift (history) is unchanged'
);

select is(
  (select cancelled_at from shifts where id = 'd0000001-0000-0000-0000-000000000005'),
  (select cancelled_at from before_rows where id = 'd0000001-0000-0000-0000-000000000005'),
  'AC-03: the shift that was already cancelled keeps its original cancelled_at'
);

select is(
  (select count(*)::int from shifts s join before_rows b using (id)
    where s.id = 'd0000005-0000-0000-0000-000000000001'
      and (s.ends_at is distinct from b.ends_at or s.cancelled_at is distinct from b.cancelled_at)),
  0,
  'AC-03: Daniel''s shift with Margaret is untouched'
);

select is(
  (select count(*)::int from care_event_completions
    where actor_id = 'a3333333-3333-3333-3333-333333333333' and actor_display_name = 'Aisha Rahman'),
  1,
  'AC-03: Aisha''s earlier completion is untouched'
);

-- ---------------------------------------------------------------------------
-- AC-05 Deactivating again succeeds and changes no shift.
-- ---------------------------------------------------------------------------
create temp table after_rows as select id, starts_at, ends_at, cancelled_at from shifts;
grant select on after_rows to authenticated;

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select is_active from admin_deactivate_staff('a3333333-3333-3333-3333-333333333333')),
  false,
  'AC-05: deactivating an already inactive carer succeeds'
);

reset role;
select is(
  (select count(*)::int from shifts s join after_rows b using (id)
    where s.starts_at is distinct from b.starts_at
       or s.ends_at is distinct from b.ends_at
       or s.cancelled_at is distinct from b.cancelled_at),
  0,
  'AC-05: the second call changed no shift'
);

select * from finish();
rollback;
