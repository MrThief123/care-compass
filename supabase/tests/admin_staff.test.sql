-- [ADM-02] Admin — Staff list and add/edit staff
-- Covers AC-04 (T-04): an admin updating a profile outside their own organisation is rejected by
-- RLS/the SECURITY DEFINER guard, plus the shape and input rules of admin_create_staff_profile,
-- admin_discard_staff_invite and admin_update_staff (docs/development/admin-dev/admin-staff/).
begin;
select plan(25);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

-- Priya admins Banksia, Rita admins Wattle. Aisha is an existing Banksia carer (edit target).
-- Bob is an existing Wattle carer (AC-04's cross-org target). Nina is a freshly invited auth user
-- with no profile yet (the state right after the jobs module creates the account).
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'priya@example.test'),
  ('a2222222-2222-2222-2222-222222222222', 'rita@example.test'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.test'),
  ('a4444444-4444-4444-4444-444444444444', 'bob@example.test'),
  ('a5555555-5555-5555-5555-555555555555', 'nina@example.test');

insert into profiles (id, role, organisation_id, first_name, last_name, email, phone, job_title) values
  ('a1111111-1111-1111-1111-111111111111', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', 'priya@example.test', null, null),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '22222222-2222-2222-2222-222222222222', 'Rita', 'Cole', 'rita@example.test', null, null),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', 'aisha@example.test', '0400000001', 'Registered Nurse'),
  ('a4444444-4444-4444-4444-444444444444', 'carer', '22222222-2222-2222-2222-222222222222', 'Bob', 'Diaz', 'bob@example.test', '0400000002', 'Support Worker');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------
select has_function('public', 'admin_create_staff_profile', 'admin_create_staff_profile exists');
select has_function('public', 'admin_discard_staff_invite', 'admin_discard_staff_invite exists');
select has_function('public', 'admin_update_staff', 'admin_update_staff exists');

-- ---------------------------------------------------------------------------
-- admin_create_staff_profile
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select throws_ok(
  $$select admin_create_staff_profile('a5555555-5555-5555-5555-555555555555', '', 'Ray', null, 'nina@example.test', 'Enrolled Nurse')$$,
  '22023',
  null,
  '[ADM-02][AC-02] a blank first name is rejected'
);
select throws_ok(
  $$select admin_create_staff_profile('a5555555-5555-5555-5555-555555555555', 'Nina', 'Ray', null, 'not-an-email', 'Enrolled Nurse')$$,
  '22023',
  null,
  '[ADM-02][AC-02] an invalid email is rejected'
);

select lives_ok(
  $$select admin_create_staff_profile('a5555555-5555-5555-5555-555555555555', 'Nina', 'Ray', '0400000003', 'nina@example.test', 'Enrolled Nurse')$$,
  '[ADM-02][AC-01] Priya creates Nina''s staff profile'
);

select throws_ok(
  $$select admin_create_staff_profile('a5555555-5555-5555-5555-555555555555', 'Nina', 'Ray', null, 'nina@example.test', 'Enrolled Nurse')$$,
  '23505',
  null,
  '[ADM-02][PRD] the same user cannot be given a profile twice'
);

reset role;
select is(
  (select role::text from profiles where id = 'a5555555-5555-5555-5555-555555555555'),
  'carer',
  '[ADM-02][AC-01] Nina''s profile role is carer'
);
select is(
  (select organisation_id from profiles where id = 'a5555555-5555-5555-5555-555555555555'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  '[ADM-02][AC-01] Nina belongs to Priya''s organisation, not a parameter she could choose'
);
select is(
  (select job_title from profiles where id = 'a5555555-5555-5555-5555-555555555555'),
  'Enrolled Nurse',
  '[ADM-02][AC-01] Nina''s role (job title) is stored'
);

-- A non-admin cannot invite staff.
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$select admin_create_staff_profile('a4444444-4444-4444-4444-444444444444', 'X', 'Y', null, 'x@example.test', null)$$,
  '42501',
  null,
  '[ADM-02][PRD] a carer cannot create a staff profile'
);
reset role;

set local role anon;
select throws_ok(
  $$select admin_create_staff_profile('a5555555-5555-5555-5555-555555555555', 'X', 'Y', null, 'x@example.test', null)$$,
  '42501',
  null,
  '[ADM-02][PRD] anon cannot call admin_create_staff_profile'
);
reset role;

-- ---------------------------------------------------------------------------
-- admin_update_staff
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select lives_ok(
  $$select admin_update_staff('a3333333-3333-3333-3333-333333333333', 'Aisha', 'Rahman', '0400000099', 'aisha.new@example.test', 'Support Worker')$$,
  '[ADM-02][AC-03] Priya edits Aisha''s profile'
);

reset role;
select is(
  (select phone from profiles where id = 'a3333333-3333-3333-3333-333333333333'),
  '0400000099',
  '[ADM-02][AC-03] Aisha''s phone is updated'
);
select is(
  (select job_title from profiles where id = 'a3333333-3333-3333-3333-333333333333'),
  'Support Worker',
  '[ADM-02][AC-03] Aisha''s role (job title) is updated'
);

-- AC-04: Priya (Banksia) cannot update Bob, a Wattle carer.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$select admin_update_staff('a4444444-4444-4444-4444-444444444444', 'Bob', 'Diaz', null, 'bob@example.test', null)$$,
  '42501',
  null,
  '[ADM-02][AC-04] Priya cannot update a Wattle carer''s profile'
);
reset role;
select is(
  (select first_name from profiles where id = 'a4444444-4444-4444-4444-444444444444'),
  'Bob',
  '[ADM-02][AC-04] Bob''s profile is unchanged'
);

-- An admin cannot use this RPC on another admin's own profile (role filter is carer-only), even
-- their own organisation's.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$select admin_update_staff('a1111111-1111-1111-1111-111111111111', 'Priya', 'Nair', null, 'priya@example.test', null)$$,
  '42501',
  null,
  '[ADM-02][PRD] admin_update_staff never edits an admin profile, even the caller''s own'
);
reset role;

-- Input validation on update too.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$select admin_update_staff('a3333333-3333-3333-3333-333333333333', '   ', 'Rahman', null, 'aisha@example.test', null)$$,
  '22023',
  null,
  '[ADM-02][AC-02] a blank first name is rejected on edit too'
);
reset role;

-- A carer cannot edit any profile through this RPC.
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$select admin_update_staff('a3333333-3333-3333-3333-333333333333', 'Aisha', 'Rahman', null, 'aisha@example.test', null)$$,
  '42501',
  null,
  '[ADM-02][PRD] a carer cannot edit even their own profile through admin_update_staff'
);
reset role;

-- ---------------------------------------------------------------------------
-- admin_discard_staff_invite
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('a6666666-6666-6666-6666-666666666666', 'half-made@example.test');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$select admin_discard_staff_invite('a6666666-6666-6666-6666-666666666666')$$,
  '[ADM-02][PRD] an admin can discard a half-made invite (no profile yet)'
);
reset role;
select is(
  (select count(*)::int from auth.users where id = 'a6666666-6666-6666-6666-666666666666'),
  0,
  '[ADM-02][PRD] the half-made auth user is gone'
);

-- Discarding a user who already has a working profile never removes the account.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$select admin_discard_staff_invite('a3333333-3333-3333-3333-333333333333')$$,
  '[ADM-02][PRD] discarding a registered carer does not raise'
);
reset role;
select is(
  (select count(*)::int from auth.users where id = 'a3333333-3333-3333-3333-333333333333'),
  1,
  '[ADM-02][PRD] discard never removes a working account'
);

-- A non-admin cannot discard anything.
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$select admin_discard_staff_invite('a4444444-4444-4444-4444-444444444444')$$,
  '42501',
  null,
  '[ADM-02][PRD] a carer cannot call admin_discard_staff_invite'
);
reset role;

select * from finish();
rollback;
