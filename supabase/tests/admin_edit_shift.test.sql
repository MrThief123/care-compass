-- [ADM-09] Admin edits, extends or cancels a shift (PD-053, FD-01 to FD-04).
-- Covers AC-01 to AC-05 of docs/development/admin-dev/admin-edit-shift/ACCEPTANCE_CRITERIA.md.
-- Times are relative to now() so "ended", "in progress" and "future" do not depend on the day it runs.
begin;
select plan(27);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'daniel@example.com'),
  ('a6666666-6666-6666-6666-666666666666', 'dean@example.com'),
  ('a7777777-7777-7777-7777-777777777777', 'bea@example.com');

-- Helen (family, Margaret), Priya (admin, Banksia), Aisha, Daniel and Dean (carers, Banksia; Dean
-- is deactivated), Wendy (admin, Wattle), Bea (carer, Wattle)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a5555555-5555-5555-5555-555555555555', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Kelly', true),
  ('a6666666-6666-6666-6666-666666666666', 'carer', '11111111-1111-1111-1111-111111111111', 'Dean', 'Inactive', false),
  ('a7777777-7777-7777-7777-777777777777', 'carer', '22222222-2222-2222-2222-222222222222', 'Bea', 'Other', true);

insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Doyle', '1945-03-01'),
  ('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Nell', 'Ford', '1938-01-01');
insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter');

-- s1 future, Aisha          s2 in progress, Aisha (extended)   s3 ended, Aisha
-- s4 future but cancelled   s5 future, Aisha (reassign tests)  s6 in progress, Daniel (cancelled)
insert into shifts (id, client_id, carer_id, starts_at, ends_at, cancelled_at) values
  ('f1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('f2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour', null),
  ('f3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '5 hours', now() - interval '3 hours', null),
  ('f4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '2 days', now() + interval '2 days 4 hours', now()),
  ('f5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '3 days', now() + interval '3 days 4 hours', null),
  ('f6666666-6666-6666-6666-666666666666', 'b1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', now() - interval '1 hour', now() + interval '1 hour', null);

create or replace function pg_temp.login(p_user_id uuid, p_aal text default 'aal2') returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- How many rows an UPDATE touched (RLS filters silently, so a refused update touches 0).
create or replace function pg_temp.touched(p_sql text) returns int as $$
declare n int;
begin
  execute 'with u as (' || p_sql || ' returning 1) select count(*)::int from u' into n;
  return n;
end;
$$ language plpgsql;

create temp table frozen as select id, starts_at, ends_at, carer_id, cancelled_at from shifts;
grant select on frozen to authenticated;

-- ---------------------------------------------------------------------------
-- [T-01][AC-01] extend an in-progress shift
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');

select is(
  pg_temp.touched($$update shifts set ends_at = ends_at + interval '2 hours' where id = 'f2222222-2222-2222-2222-222222222222'$$),
  1, '[T-01][AC-01] Priya extends the in-progress shift by two hours');
select is(
  (select ends_at from shifts where id = 'f2222222-2222-2222-2222-222222222222'),
  (select ends_at + interval '2 hours' from frozen where id = 'f2222222-2222-2222-2222-222222222222'),
  '[T-01][AC-01] the stored end moved by exactly two hours');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select ok(carer_on_active_shift('b1111111-1111-1111-1111-111111111111'),
  '[T-01][AC-01] Aisha is on an active shift for Margaret after the extension');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  pg_temp.touched($$update shifts set starts_at = now() + interval '30 minutes' where id = 'f2222222-2222-2222-2222-222222222222'$$),
  1, '[T-01][AC-01] moving the start into the future is also allowed for a shift that has not ended');

-- ---------------------------------------------------------------------------
-- [T-02][AC-02] who may edit, and the audit trail
-- ---------------------------------------------------------------------------
select is(
  pg_temp.touched($$update shifts set starts_at = starts_at + interval '1 hour', ends_at = ends_at + interval '2 hours', carer_id = 'a5555555-5555-5555-5555-555555555555' where id = 'f1111111-1111-1111-1111-111111111111'$$),
  1, '[T-02][AC-02] Priya (AAL2) changes start, end and carer of a future shift');

reset role;
select is((select count(*)::int from audit_log where table_name = 'shifts' and action = 'UPDATE' and record_id = 'f1111111-1111-1111-1111-111111111111'),
  1, '[T-02][AC-02] one audit UPDATE row for the edit');
select is((select actor_id from audit_log where table_name = 'shifts' and action = 'UPDATE' and record_id = 'f1111111-1111-1111-1111-111111111111'),
  'a2222222-2222-2222-2222-222222222222'::uuid, '[T-02][AC-02] the audit row names Priya');
select is((select (before ->> 'carer_id') || '>' || (after ->> 'carer_id') from audit_log where table_name = 'shifts' and action = 'UPDATE' and record_id = 'f1111111-1111-1111-1111-111111111111'),
  'a3333333-3333-3333-3333-333333333333>a5555555-5555-5555-5555-555555555555', '[T-02][AC-02] the audit row holds before and after');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(pg_temp.touched($$update shifts set ends_at = ends_at + interval '1 hour' where id = 'f5555555-5555-5555-5555-555555555555'$$),
  0, '[T-02][AC-02] a carer cannot edit a shift, even their own');
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(pg_temp.touched($$update shifts set ends_at = ends_at + interval '1 hour' where id = 'f5555555-5555-5555-5555-555555555555'$$),
  0, '[T-02][AC-02] family cannot edit a shift');
select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is(pg_temp.touched($$update shifts set ends_at = ends_at + interval '1 hour' where id = 'f5555555-5555-5555-5555-555555555555'$$),
  0, '[T-02][AC-02] another organisation''s admin cannot edit it');
select pg_temp.login('a2222222-2222-2222-2222-222222222222', 'aal1');
select is(pg_temp.touched($$update shifts set ends_at = ends_at + interval '1 hour' where id = 'f5555555-5555-5555-5555-555555555555'$$),
  0, '[T-02][AC-02] an admin without MFA (AAL1) cannot edit it');

-- ---------------------------------------------------------------------------
-- [T-03][AC-03] cancel
-- ---------------------------------------------------------------------------
select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select ok(carer_on_active_shift('b1111111-1111-1111-1111-111111111111'),
  '[T-03][AC-03] Daniel is on an active shift before it is cancelled');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(pg_temp.touched($$update shifts set cancelled_at = now() where id = 'f6666666-6666-6666-6666-666666666666'$$),
  1, '[T-03][AC-03] Priya cancels the in-progress shift');
select is((select count(*)::int from shifts where id = 'f6666666-6666-6666-6666-666666666666' and cancelled_at is not null),
  1, '[T-03][AC-03] the row is kept with cancelled_at set');

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select ok(not carer_on_active_shift('b1111111-1111-1111-1111-111111111111'),
  '[T-03][AC-03] Daniel is no longer on an active shift');

reset role;
select is((select count(*)::int from audit_log where table_name = 'shifts' and action = 'UPDATE' and record_id = 'f6666666-6666-6666-6666-666666666666' and (after ->> 'cancelled_at') is not null and (before ->> 'cancelled_at') is null),
  1, '[T-03][AC-03] the audit log records the cancellation');

-- ---------------------------------------------------------------------------
-- [T-04][AC-04] frozen shifts
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(pg_temp.touched($$update shifts set ends_at = ends_at + interval '1 hour' where id = 'f3333333-3333-3333-3333-333333333333'$$),
  0, '[T-04][AC-04] an ended shift cannot be edited');
select is(pg_temp.touched($$update shifts set cancelled_at = now() where id = 'f3333333-3333-3333-3333-333333333333'$$),
  0, '[T-04][AC-04] an ended shift cannot be cancelled');
select is(pg_temp.touched($$update shifts set starts_at = starts_at + interval '1 hour' where id = 'f4444444-4444-4444-4444-444444444444'$$),
  0, '[T-04][AC-04] a cancelled shift cannot be edited');
select is(pg_temp.touched($$update shifts set cancelled_at = null where id = 'f4444444-4444-4444-4444-444444444444'$$),
  0, '[T-04][AC-04] a cancelled shift cannot be un-cancelled');
select throws_ok($$update shifts set starts_at = now() - interval '3 hours', ends_at = now() - interval '1 hour' where id = 'f5555555-5555-5555-5555-555555555555'$$,
  '42501', null, '[T-04][AC-04] a live shift cannot be edited to end in the past');
select is((select count(*)::int from shifts s join frozen f using (id) where s.id in ('f3333333-3333-3333-3333-333333333333', 'f4444444-4444-4444-4444-444444444444', 'f5555555-5555-5555-5555-555555555555')
    and (s.starts_at, s.ends_at, s.cancelled_at) is not distinct from (f.starts_at, f.ends_at, f.cancelled_at)),
  3, '[T-04][AC-04] the three shifts are exactly as they were');

-- ---------------------------------------------------------------------------
-- [T-05][AC-05] reassignment limits
-- ---------------------------------------------------------------------------
select throws_ok($$update shifts set carer_id = 'a6666666-6666-6666-6666-666666666666' where id = 'f5555555-5555-5555-5555-555555555555'$$,
  '42501', null, '[T-05][AC-05] a deactivated carer cannot be given the shift');
select throws_ok($$update shifts set carer_id = 'a7777777-7777-7777-7777-777777777777' where id = 'f5555555-5555-5555-5555-555555555555'$$,
  '42501', null, '[T-05][AC-05] another organisation''s carer cannot be given the shift');
select throws_ok($$update shifts set client_id = 'b3333333-3333-3333-3333-333333333333' where id = 'f5555555-5555-5555-5555-555555555555'$$,
  '42501', null, '[T-05][AC-05] the client cannot be changed');
select is((select carer_id::text || '/' || client_id::text from shifts where id = 'f5555555-5555-5555-5555-555555555555'),
  'a3333333-3333-3333-3333-333333333333/b1111111-1111-1111-1111-111111111111', '[T-05][AC-05] the shift is unchanged');

select * from finish();
rollback;
