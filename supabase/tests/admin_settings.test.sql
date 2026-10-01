-- [ADM-10] Admin — Settings
-- Covers AC-03 (T-03): admin_update_organisation changes only the calling admin's own organisation,
-- refuses carers, family and signed-out callers, and there is no direct table update.
begin;
select plan(19);

insert into organisations (id, name, abn, phone, address) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care', '54 123 456 789', '03 9555 0102', '220 High St, Preston VIC 3072'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care', '11 222 333 444', '03 9000 0000', '1 Wattle St');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'priya@example.test'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.test'),
  ('a6666666-6666-6666-6666-666666666666', 'helen@example.test');

insert into profiles (id, role, organisation_id, first_name, last_name, email) values
  ('a1111111-1111-1111-1111-111111111111', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', 'priya@example.test'),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', 'aisha@example.test'),
  ('a6666666-6666-6666-6666-666666666666', 'family', '11111111-1111-1111-1111-111111111111', 'Helen', 'Wright', 'helen@example.test');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

select has_function('public', 'admin_update_organisation', 'admin_update_organisation exists');

-- Priya updates her own organisation.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  (select name from admin_update_organisation('  Banksia Care  ', '54123456789', ' 03 9555 0199 ', ' 5 High St, Preston VIC 3072 ')),
  'Banksia Care',
  'AC-04: Priya updates Banksia; the name is trimmed'
);
select is(
  (select abn from organisations where id = '11111111-1111-1111-1111-111111111111'),
  '54 123 456 789',
  'AC-04: the ABN is saved grouped as XX XXX XXX XXX'
);
select is(
  (select phone from organisations where id = '11111111-1111-1111-1111-111111111111'),
  '03 9555 0199',
  'AC-04: phone is trimmed'
);

-- AC-03: there is no way to address another organisation, and Wattle is unchanged.
select is(
  (select name from organisations where id = '22222222-2222-2222-2222-222222222222'),
  null,
  'AC-03: Priya cannot even see Wattle Care'
);
reset role;
select is(
  (select name || '|' || abn from organisations where id = '22222222-2222-2222-2222-222222222222'),
  'Wattle Care|11 222 333 444',
  'AC-03: Wattle Care is unchanged after Priya''s update'
);

-- No direct table update for anyone.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ update organisations set name = 'Hacked' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'AC-03: no direct update on organisations, even for the admin'
);

-- Input rules.
select throws_ok(
  $$ select admin_update_organisation('   ', '54123456789', '03 9555 0102', '1 High St') $$,
  '22023', null, 'AC-02: a blank name is refused'
);
select throws_ok(
  $$ select admin_update_organisation('Banksia', '123', '03 9555 0102', '1 High St') $$,
  '22023', null, 'AC-02: an ABN that is not 11 digits is refused'
);
select throws_ok(
  $$ select admin_update_organisation('Banksia', '54123456789', '', '1 High St') $$,
  '22023', null, 'AC-02: a blank phone is refused'
);

-- AC-08: Australian phone numbers only.
select throws_ok(
  $$ select admin_update_organisation('Banksia', '54123456789', '03 9555 O102', '1 High St') $$,
  '22023', null, 'AC-08: a phone with a letter is refused'
);
select throws_ok(
  $$ select admin_update_organisation('Banksia', '54123456789', '03 9555 010', '1 High St') $$,
  '22023', null, 'AC-08: a phone one digit short is refused'
);
select throws_ok(
  $$ select admin_update_organisation('Banksia', '54123456789', '+61 03 9555 0102', '1 High St') $$,
  '22023', null, 'AC-08: +61 with the leading 0 kept is refused'
);
select throws_ok(
  $$ select admin_update_organisation('Banksia', '54123456789', '+44 20 7946 0958', '1 High St') $$,
  '22023', null, 'AC-08: a non-Australian number is refused'
);
select lives_ok(
  $$ select admin_update_organisation('Banksia', '54123456789', '+61 3 9555 0102', '1 High St') $$,
  'AC-08: +61 3 9555 0102 is accepted'
);
select lives_ok(
  $$ select admin_update_organisation('Banksia', '54123456789', '1300 123 456', '1 High St') $$,
  'AC-08: a 1300 number is accepted'
);

-- Carer and family are refused.
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ select admin_update_organisation('Carer edit', '54123456789', '03 9555 0102', '1 High St') $$,
  '42501', null, 'AC-03: a carer is refused'
);
select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select throws_ok(
  $$ select admin_update_organisation('Family edit', '54123456789', '03 9555 0102', '1 High St') $$,
  '42501', null, 'AC-03: a family member is refused'
);

-- Signed out.
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$ select admin_update_organisation('Anon edit', '54123456789', '03 9555 0102', '1 High St') $$,
  '42501', null, 'AC-03: a signed-out caller is refused'
);

select * from finish();
rollback;
