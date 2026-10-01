-- [ADM-04] Admin Clients: profiles_select_linked_family
-- Covers the RLS gap this feature's migration closes: an admin can read the name of a family member
-- linked to one of their own clients, but nobody else's family member's profile
-- (docs/development/admin-dev/admin-clients/).
begin;
select plan(5);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Robert', 'King');

-- Priya admins Banksia. Helen is Margaret's (Banksia) family member, with no organisation of her own
-- (PD-057: a self-registered family account starts with none). Grace is Robert's (Wattle) family
-- member — unrelated to Priya's organisation.
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'priya@example.test'),
  ('a2222222-2222-2222-2222-222222222222', 'helen@example.test'),
  ('a3333333-3333-3333-3333-333333333333', 'grace@example.test');

insert into profiles (id, role, organisation_id, first_name, last_name) values
  ('a1111111-1111-1111-1111-111111111111', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair'),
  ('a2222222-2222-2222-2222-222222222222', 'family', null, 'Helen', 'Doyle'),
  ('a3333333-3333-3333-3333-333333333333', 'family', null, 'Grace', 'Smith');

insert into client_family_members (client_id, profile_id) values
  ('b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222'),
  ('b2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select is(
  (select first_name from profiles where id = 'a2222222-2222-2222-2222-222222222222'),
  'Helen',
  '[ADM-04][AC-01] Priya can read Helen, her own client Margaret''s linked family member'
);
select is(
  (select count(*)::int from profiles where id = 'a3333333-3333-3333-3333-333333333333'),
  0,
  '[ADM-04][AC-02] Priya cannot read Grace, Wattle''s Robert''s family member'
);

reset role;
select pg_temp.login('a2222222-2222-2222-2222-222222222222');

select is(
  (select first_name from profiles where id = 'a2222222-2222-2222-2222-222222222222'),
  'Helen',
  '[ADM-04][PRD] Helen can still read her own profile (profiles_select_self, unaffected)'
);
select is(
  (select count(*)::int from profiles where id = 'a1111111-1111-1111-1111-111111111111'),
  0,
  '[ADM-04][PRD] Helen (no organisation) cannot read Priya''s profile'
);

reset role;
-- request.jwt.claim.sub is transaction-local (set_config's third argument), so it survives `reset
-- role` on its own; clear it explicitly, or anon would inherit Helen's leftover identity.
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
set local role anon;
select is(
  (select count(*)::int from profiles where id = 'a2222222-2222-2222-2222-222222222222'),
  0,
  '[ADM-04][PRD] anon reads no profiles at all'
);
reset role;

select * from finish();
rollback;
