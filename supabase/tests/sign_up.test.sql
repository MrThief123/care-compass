-- [F0-17] Self-serve sign-up for Family and Organisation accounts
-- Covers AC-05 (T-05) and AC-07 (T-07) (docs/development/shared/shared-sign-up/ACCEPTANCE_CRITERIA.md)
-- for register_account() and discard_unregistered_account(), plus the registration rules
-- AC-01, AC-02 and AC-06 rest on (what each role creates, and that nothing can be linked to
-- an existing organisation or client).
begin;
select plan(38);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care');

insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells');

-- Grace signs up as family, Owen as an organisation, Cara tries to become a carer,
-- Nina never finishes registering, Helen already has a profile.
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'grace@example.test'),
  ('a2222222-2222-2222-2222-222222222222', 'owen@example.test'),
  ('a3333333-3333-3333-3333-333333333333', 'cara@example.test'),
  ('a4444444-4444-4444-4444-444444444444', 'nina@example.test'),
  ('a5555555-5555-5555-5555-555555555555', 'helen@example.test');

insert into profiles (id, role, organisation_id, first_name, last_name) values
  ('a5555555-5555-5555-5555-555555555555', 'family', null, 'Helen', 'Doyle');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Shape of the function
-- ---------------------------------------------------------------------------
select has_function('public', 'register_account', 'register_account exists');
select has_function('public', 'discard_unregistered_account', 'discard_unregistered_account exists');

-- AC-06: the function takes no organisation id and no client id, so a request cannot ask
-- to be linked to an existing one.
select is(
  (select count(*)::int
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'register_account'
     and (array_to_string(p.proargnames, ',') ~* '(organisation_id|client_id)')),
  0,
  '[F0-17][AC-06] register_account has no organisation_id or client_id parameter'
);

-- ---------------------------------------------------------------------------
-- AC-05 (T-05): a carer can never be registered
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');

select throws_ok(
  $$select register_account('carer', 'Cara', 'Lee')$$,
  '42501',
  null,
  '[F0-17][AC-05] registering as a carer is rejected'
);

reset role;

select is(
  (select count(*)::int from profiles where id = 'a3333333-3333-3333-3333-333333333333'),
  0,
  '[F0-17][AC-05] no profile exists for the caller after the carer attempt'
);

-- A signed-out caller is rejected, and anon cannot even execute the function.
reset role;
set local role anon;
select throws_ok(
  $$select register_account('family', 'Anon', 'User', 'Harold', 'Smith')$$,
  '42501',
  null,
  '[F0-17][AC-05] anon cannot call register_account'
);
reset role;

-- ---------------------------------------------------------------------------
-- Family registration (AC-01, AC-06)
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

create temp table grace_result as
select register_account('family', 'Grace', 'Smith', 'Harold', 'Smith') as result;
grant select on grace_result to authenticated;

select is(
  (select result ->> 'role' from grace_result),
  'family',
  '[F0-17][AC-01] family registration reports the role'
);

reset role;

select is(
  (select role::text from profiles where id = 'a1111111-1111-1111-1111-111111111111'),
  'family',
  '[F0-17][AC-01] Grace has a family profile'
);
select is(
  (select organisation_id from profiles where id = 'a1111111-1111-1111-1111-111111111111'),
  null,
  '[F0-17][AC-01] Grace has no organisation'
);
select is(
  (select first_name || ' ' || last_name from profiles where id = 'a1111111-1111-1111-1111-111111111111'),
  'Grace Smith',
  '[F0-17][AC-01] Grace''s names are stored'
);
select is(
  (select email from profiles where id = 'a1111111-1111-1111-1111-111111111111'),
  'grace@example.test',
  '[F0-17][AC-01] the contact email is taken from her auth account, not from the caller'
);
select is(
  (select count(*)::int from clients where first_name = 'Harold' and last_name = 'Smith'),
  1,
  '[F0-17][AC-01] Harold Smith exists once'
);
select is(
  (select organisation_id from clients where first_name = 'Harold' and last_name = 'Smith'),
  null,
  '[F0-17][AC-01] Harold has no organisation'
);
select is(
  (select count(*)::int
   from client_family_members m
   join clients c on c.id = m.client_id
   where c.first_name = 'Harold' and c.last_name = 'Smith'
     and m.profile_id = 'a1111111-1111-1111-1111-111111111111'),
  1,
  '[F0-17][AC-01] Grace is Harold''s family member'
);
select is(
  (select (result ->> 'client_id')::uuid from grace_result),
  (select id from clients where first_name = 'Harold' and last_name = 'Smith'),
  '[F0-17][AC-01] the result carries Harold''s client id, for the redirect'
);

-- AC-06: nothing about Banksia or Margaret is reachable to the new family account.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is((select count(*)::int from organisations), 0, '[F0-17][AC-06] Grace reads no organisation');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  '[F0-17][AC-06] Grace cannot read Margaret'
);
select is(
  (select count(*)::int from clients),
  1,
  '[F0-17][AC-06] Grace reads only Harold'
);
reset role;

-- ---------------------------------------------------------------------------
-- Organisation registration (AC-02)
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');

create temp table owen_result as
select register_account('admin', 'Owen', 'Park', null, null, 'Wattle Care') as result;
grant select on owen_result to authenticated;

reset role;

select is(
  (select role::text from profiles where id = 'a2222222-2222-2222-2222-222222222222'),
  'admin',
  '[F0-17][AC-02] Owen has an admin profile'
);
select is(
  (select o.name
   from profiles p join organisations o on o.id = p.organisation_id
   where p.id = 'a2222222-2222-2222-2222-222222222222'),
  'Wattle Care',
  '[F0-17][AC-02] Owen is admin of the new organisation Wattle Care'
);
select is(
  (select count(*)::int from organisations where name = 'Wattle Care'),
  1,
  '[F0-17][AC-02] Wattle Care exists once'
);
select isnt(
  (select organisation_id from profiles where id = 'a2222222-2222-2222-2222-222222222222'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  '[F0-17][AC-06] Owen is not attached to Banksia'
);
select is(
  (select count(*)::int from clients c
   join profiles p on p.organisation_id = c.organisation_id
   where p.id = 'a2222222-2222-2222-2222-222222222222'),
  0,
  '[F0-17][AC-06] the new organisation starts with no clients'
);

-- ---------------------------------------------------------------------------
-- Input rules
-- ---------------------------------------------------------------------------
-- The role check comes before anything else: a caller who is not registered yet but sends
-- bad input gets a clear error and no partial rows.
select pg_temp.login('a4444444-4444-4444-4444-444444444444');

select throws_ok(
  $$select register_account('family', 'Nina', 'Ray')$$,
  '22023',
  null,
  '[F0-17][AC-03] family registration without a client name is rejected'
);
select throws_ok(
  $$select register_account('admin', 'Nina', 'Ray')$$,
  '22023',
  null,
  '[F0-17][AC-03] organisation registration without an organisation name is rejected'
);
select throws_ok(
  $$select register_account('family', '   ', 'Ray', 'Harold', 'Smith')$$,
  '22023',
  null,
  '[F0-17][AC-03] a blank first name is rejected'
);

reset role;
select is(
  (select count(*)::int from profiles where id = 'a4444444-4444-4444-4444-444444444444'),
  0,
  '[F0-17][AC-03] the rejected attempts left no profile'
);
select is(
  (select count(*)::int from clients where first_name = 'Harold' and last_name = 'Smith'),
  1,
  '[F0-17][AC-03] the rejected attempts left no extra client'
);

-- ---------------------------------------------------------------------------
-- AC-07 (T-07): registered users cannot change role, organisation or active flag,
-- and cannot register twice
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select throws_ok(
  $$update profiles set role = 'admin' where id = 'a1111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  '[F0-17][AC-07] a signed-up family user cannot change their role'
);
select throws_ok(
  $$update profiles set organisation_id = '11111111-1111-1111-1111-111111111111' where id = 'a1111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  '[F0-17][AC-07] a signed-up family user cannot join an organisation'
);
select throws_ok(
  $$update profiles set is_active = false where id = 'a1111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  '[F0-17][AC-07] a signed-up family user cannot change is_active'
);
select throws_ok(
  $$select register_account('family', 'Grace', 'Smith', 'Again', 'Client')$$,
  '23505',
  null,
  '[F0-17][AC-07] a registered family user cannot register a second time'
);

select pg_temp.login('a2222222-2222-2222-2222-222222222222');

select throws_ok(
  $$update profiles set role = 'family' where id = 'a2222222-2222-2222-2222-222222222222'$$,
  '42501',
  null,
  '[F0-17][AC-07] a signed-up admin cannot change their role'
);
select throws_ok(
  $$update profiles set organisation_id = '11111111-1111-1111-1111-111111111111' where id = 'a2222222-2222-2222-2222-222222222222'$$,
  '42501',
  null,
  '[F0-17][AC-07] a signed-up admin cannot move to another organisation'
);
select throws_ok(
  $$select register_account('admin', 'Owen', 'Park', null, null, 'Second Org')$$,
  '23505',
  null,
  '[F0-17][AC-07] a registered admin cannot register a second time'
);

reset role;
select is(
  (select count(*)::int from organisations where name = 'Second Org'),
  0,
  '[F0-17][AC-07] the second attempt created no organisation'
);

-- Public sign-up has no general insert path into the tenancy tables.
select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select throws_ok(
  $$insert into organisations (name) values ('Sneaky Org')$$,
  '42501',
  null,
  '[F0-17][PRD] an authenticated user cannot insert an organisation directly'
);
select throws_ok(
  $$insert into profiles (id, role) values ('a4444444-4444-4444-4444-444444444444', 'admin')$$,
  '42501',
  null,
  '[F0-17][PRD] an authenticated user cannot insert a profile directly'
);
reset role;

-- ---------------------------------------------------------------------------
-- Half-made accounts: discard_unregistered_account()
-- ---------------------------------------------------------------------------
select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select lives_ok(
  $$select discard_unregistered_account()$$,
  '[F0-17][PRD] a caller with no profile can discard their own half-made account'
);
reset role;
select is(
  (select count(*)::int from auth.users where id = 'a4444444-4444-4444-4444-444444444444'),
  0,
  '[F0-17][PRD] the half-made auth user is gone'
);

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select lives_ok(
  $$select discard_unregistered_account()$$,
  '[F0-17][PRD] discard by a user who has a profile does not raise'
);
reset role;
select is(
  (select count(*)::int from auth.users where id = 'a5555555-5555-5555-5555-555555555555'),
  1,
  '[F0-17][PRD] discard never removes a registered account'
);

select * from finish();
rollback;
