-- [F0-06] Identity, organisation and client access schema with RLS
-- Covers AC-01..AC-08 (docs/development/shared/shared-tenancy-schema-rls/ACCEPTANCE_CRITERIA.md)
begin;
select plan(8);

-- Seed: two organisations
insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

-- Seed: auth users backing each profile under test
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'deactivated-carer@example.com');

-- Seed: profiles — Helen (family), Priya (admin, Banksia), Aisha (carer, Banksia), a deactivated carer (Banksia)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Smith', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a5555555-5555-5555-5555-555555555555', 'carer', '11111111-1111-1111-1111-111111111111', 'Deactivated', 'Carer', false);

-- Seed: clients — Margaret (Banksia, Helen's), Nell (Banksia, ended assignment), Robert (Wattle, another org)
insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells', '1945-03-01'),
  ('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Nell', 'Ford', '1938-01-01'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Robert', 'Doyle', '1950-05-05');

-- Seed: Helen is linked to Margaret only
insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter');

-- Seed: Aisha has an active assignment to Margaret, an ended assignment to Nell;
-- the deactivated carer has an active assignment to Margaret too (to prove is_active blocks it)
insert into carer_client_assignments (carer_id, client_id, organisation_id, started_at, ended_at) values
  ('a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() - interval '2 hours', null),
  ('a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() - interval '5 days', now() - interval '1 day'),
  ('a5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() - interval '1 hour', null);

-- Impersonation helper: switches to the `authenticated` role with the given user's JWT sub claim
create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- AC-01: Helen (family, linked to Margaret) selects clients -> only Margaret's row
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select results_eq(
  $$ select id from clients order by id $$,
  $$ values ('b1111111-1111-1111-1111-111111111111'::uuid) $$,
  'AC-01: Helen sees only her linked client (Margaret)'
);

-- AC-02: Helen selects Robert's row by id -> zero rows
select is(
  (select count(*)::int from clients where id = 'b2222222-2222-2222-2222-222222222222'),
  0,
  'AC-02: Helen selecting Robert (not linked to her) returns zero rows'
);

-- AC-03: Priya (admin, Banksia) selects clients -> exactly Banksia's clients (Margaret, Nell)
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select results_eq(
  $$ select id from clients order by id $$,
  $$ values ('b1111111-1111-1111-1111-111111111111'::uuid), ('b3333333-3333-3333-3333-333333333333'::uuid) $$,
  'AC-03: Priya sees exactly her organisation''s clients'
);

-- AC-04: Priya selects Robert (another organisation) -> zero rows
select is(
  (select count(*)::int from clients where id = 'b2222222-2222-2222-2222-222222222222'),
  0,
  'AC-04: Priya selecting another organisation''s client returns zero rows'
);

-- AC-05: Aisha (carer, active assignment to Margaret) selects clients -> Margaret returned
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  1,
  'AC-05: Aisha with an active assignment sees Margaret'
);

-- AC-06: Aisha selects Robert (same lane, no assignment, different org) -> zero rows
select is(
  (select count(*)::int from clients where id = 'b2222222-2222-2222-2222-222222222222'),
  0,
  'AC-06: Aisha selecting an unassigned client returns zero rows'
);

-- AC-07: Aisha's assignment to Nell has ended_at in the past -> zero rows
select is(
  (select count(*)::int from clients where id = 'b3333333-3333-3333-3333-333333333333'),
  0,
  'AC-07: Aisha selecting a client with an ended assignment returns zero rows'
);

-- AC-08: Deactivated carer (is_active = false, active assignment to Margaret) -> zero rows
select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from clients),
  0,
  'AC-08: A deactivated carer profile matches no RLS policy'
);

select * from finish();
rollback;
