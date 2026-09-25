-- [FAM-12] Family — Settings: family info and password reset
-- Covers AC-04 (docs/development/family-dev/family-settings-profile/ACCEPTANCE_CRITERIA.md):
-- a user updates only their own profile row, and only its contact columns.
begin;
select plan(9);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com');

-- Helen (family, no organisation), Priya (admin, Banksia), Aisha (carer, Banksia)
insert into profiles (id, role, organisation_id, first_name, last_name, phone, email, address, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', '0412 345 678', 'helen@example.com', '12 Wattle St', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', '0400 000 001', 'priya@example.com', null, true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', '0400 000 002', 'aisha@example.com', null, true);

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- Rows changed by an update, so a policy that hides the row (0) is told apart from one that allows it (1).
create or replace function pg_temp.rows_changed(p_sql text) returns int as $$
declare
  n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$ language plpgsql;

select pg_temp.login('a1111111-1111-1111-1111-111111111111');

-- AC-01 (data layer): Helen updates her own contact details.
select is(
  pg_temp.rows_changed($$ update profiles set first_name = 'Helena', last_name = 'Doyle-Smith', phone = '0499 999 999', email = 'helena@example.com', address = '1 New Rd' where id = 'a1111111-1111-1111-1111-111111111111' $$),
  1,
  'AC-01: Helen can update her own first name, last name, phone, email and address'
);

select results_eq(
  $$ select phone, email, address from profiles where id = 'a1111111-1111-1111-1111-111111111111' $$,
  $$ values ('0499 999 999'::text, 'helena@example.com'::text, '1 New Rd'::text) $$,
  'AC-01: the new values are stored'
);

-- AC-04: Helen cannot see Aisha's row (another organisation), so an update changes nothing.
select is(
  pg_temp.rows_changed($$ update profiles set phone = '0000 000 000' where id = 'a3333333-3333-3333-3333-333333333333' $$),
  0,
  'AC-04: Helen updating a profile she cannot see changes no rows'
);

-- Helen cannot escalate her own row.
select throws_ok(
  $$ update profiles set role = 'admin' where id = 'a1111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'AC-04: Helen cannot change her own role'
);

select throws_ok(
  $$ update profiles set organisation_id = '11111111-1111-1111-1111-111111111111' where id = 'a1111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'AC-04: Helen cannot change her own organisation'
);

select throws_ok(
  $$ update profiles set is_active = false where id = 'a1111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'AC-04: Helen cannot change her own active flag'
);

-- Priya (admin) can see Aisha's row in her organisation, but that does not let her edit it.
select pg_temp.login('a2222222-2222-2222-2222-222222222222');

select is(
  (select count(*)::int from profiles where id = 'a3333333-3333-3333-3333-333333333333'),
  1,
  'setup: Priya can read Aisha (same organisation)'
);

select is(
  pg_temp.rows_changed($$ update profiles set phone = '0000 000 000' where id = 'a3333333-3333-3333-3333-333333333333' $$),
  0,
  'AC-04: Priya updating a profile she can read but does not own changes no rows'
);

-- Nothing of Aisha's changed.
select results_eq(
  $$ select phone from profiles where id = 'a3333333-3333-3333-3333-333333333333' $$,
  $$ values ('0400 000 002'::text) $$,
  'AC-04: Aisha''s phone is unchanged'
);

select * from finish();
rollback;
