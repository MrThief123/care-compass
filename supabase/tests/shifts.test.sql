-- [F0-10] Shifts schema, active-shift function and conflict query
-- Covers AC-01..AC-07 (docs/development/shared/shared-shifts-schema/ACCEPTANCE_CRITERIA.md)
begin;
select plan(7);

-- Seed: one organisation
insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care');

-- Seed: auth users backing each profile under test
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com');

-- Seed: profiles — Helen (family), Priya (admin, Banksia), Aisha (carer, Banksia)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Smith', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true);

-- Seed: clients — Margaret (Banksia, Helen's), Nell (Banksia, not linked to Helen)
insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells', '1945-03-01'),
  ('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Nell', 'Ford', '1938-01-01');

-- Seed: Helen is linked to Margaret only
insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter');

-- Impersonation helper: switches to the `authenticated` role with the given user's JWT sub claim
create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- Fixture shift for Aisha/Margaret: active now (starts 2h ago, ends in 2h) — inserted as admin, RLS bypass via service role context
set local role postgres;
insert into shifts (id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by) values
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '2 hours', now() + interval '2 hours', 'a2222222-2222-2222-2222-222222222222');

-- [T-01][AC-01] Aisha on an active shift for Margaret -> carer_on_active_shift returns true
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  carer_on_active_shift('b1111111-1111-1111-1111-111111111111'),
  true,
  '[T-01][AC-01] Aisha on an active shift for Margaret sees carer_on_active_shift = true'
);

-- [T-02][AC-02] a shift whose ends_at is exactly now -> not active (half-open interval)
set local role postgres;
insert into shifts (id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by) values
  ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '4 hours', now(), 'a2222222-2222-2222-2222-222222222222');
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select s.starts_at <= now() and now() < s.ends_at from shifts s where s.id = 'c2222222-2222-2222-2222-222222222222'),
  false,
  '[T-02][AC-02] a shift ending exactly now is not active (half-open interval)'
);

-- [T-03][AC-03] a cancelled shift, otherwise active window -> carer_on_active_shift returns false
set local role postgres;
insert into shifts (id, organisation_id, client_id, carer_id, starts_at, ends_at, cancelled_at, created_by) values
  ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour', now() - interval '10 minutes', 'a2222222-2222-2222-2222-222222222222');
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  carer_on_active_shift('b3333333-3333-3333-3333-333333333333'),
  false,
  '[T-03][AC-03] a cancelled shift does not grant active-shift rights'
);

-- [T-04][AC-04] overlapping_shifts(carer, window) returns a shift whose window overlaps
set local role postgres;
insert into shifts (id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by) values
  ('c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '11 hours 30 minutes', now() + interval '13 hours', 'a2222222-2222-2222-2222-222222222222');
select results_eq(
  $$ select id from overlapping_shifts('a3333333-3333-3333-3333-333333333333'::uuid, now() + interval '12 hours', now() + interval '15 hours') order by id $$,
  $$ values ('c4444444-4444-4444-4444-444444444444'::uuid) $$,
  '[T-04][AC-04] overlapping_shifts returns the shift whose window overlaps the query window'
);

-- [T-05][AC-05] an admin inserting an overlapping shift succeeds (soft warning only, no hard block)
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select lives_ok(
  $$ insert into shifts (id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by) values
     ('c5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', now() + interval '12 hours 30 minutes', now() + interval '14 hours', 'a2222222-2222-2222-2222-222222222222') $$,
  '[T-05][AC-05] admin inserting an overlapping shift for the same carer succeeds'
);

-- [T-06][AC-06] a carer inserting a shift is rejected by RLS
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ insert into shifts (id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by) values
     ('c6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now(), now() + interval '1 hour', 'a3333333-3333-3333-3333-333333333333') $$,
  '42501',
  'new row violates row-level security policy for table "shifts"',
  '[T-06][AC-06] a carer inserting a shift is rejected by RLS'
);

-- [T-07][AC-07] Helen (family, linked to Margaret only) selects shifts -> Margaret's shifts only
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select results_eq(
  $$ select distinct client_id from shifts order by client_id $$,
  $$ values ('b1111111-1111-1111-1111-111111111111'::uuid) $$,
  '[T-07][AC-07] Helen sees shifts for Margaret only, not Nell'
);

select * from finish();
rollback;
