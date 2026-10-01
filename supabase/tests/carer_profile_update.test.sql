-- [CAR-09] Carer — Settings
-- Covers AC-02 (docs/development/carer-dev/carer-settings/ACCEPTANCE_CRITERIA.md): a carer
-- updates her own contact columns, and cannot change her job title, role, organisation or
-- active flag, nor another carer's row. Uses the FAM-12 grant; there is no CAR-09 migration.
begin;
select plan(9);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'marcus@example.com');

-- Aisha and Marcus, both carers at Banksia
insert into profiles (id, role, organisation_id, first_name, last_name, phone, email, job_title, is_active) values
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', '0423 987 654', 'aisha.r@banksiahomecare.com.au', 'Registered Nurse', true),
  ('a4444444-4444-4444-4444-444444444444', 'carer', '11111111-1111-1111-1111-111111111111', 'Marcus', 'Chen', '0400 000 003', 'marcus@example.com', 'Enrolled Nurse', true);

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
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

select pg_temp.login('a3333333-3333-3333-3333-333333333333');

-- AC-02 (positive side): Aisha updates her own name, phone and contact email.
select is(
  pg_temp.rows_changed($$ update profiles set first_name = 'Aisha', last_name = 'Rahman-Lee', phone = '0499 999 999', email = 'aisha.new@banksiahomecare.com.au' where id = 'a3333333-3333-3333-3333-333333333333' $$),
  1,
  'AC-02: Aisha can update her own name, phone and contact email'
);

-- AC-02: she cannot change what the admin controls.
select throws_ok(
  $$ update profiles set job_title = 'Nurse Practitioner' where id = 'a3333333-3333-3333-3333-333333333333' $$,
  '42501',
  null,
  'AC-02: Aisha cannot change her own job title'
);

select throws_ok(
  $$ update profiles set role = 'admin' where id = 'a3333333-3333-3333-3333-333333333333' $$,
  '42501',
  null,
  'AC-02: Aisha cannot change her own role'
);

select throws_ok(
  $$ update profiles set organisation_id = '22222222-2222-2222-2222-222222222222' where id = 'a3333333-3333-3333-3333-333333333333' $$,
  '42501',
  null,
  'AC-02: Aisha cannot move herself to another organisation'
);

select throws_ok(
  $$ update profiles set is_active = false where id = 'a3333333-3333-3333-3333-333333333333' $$,
  '42501',
  null,
  'AC-02: Aisha cannot change her own active flag'
);

-- A colleague's row: whether or not she can read it, an update changes nothing.
select is(
  pg_temp.rows_changed($$ update profiles set phone = '0000 000 000' where id = 'a4444444-4444-4444-4444-444444444444' $$),
  0,
  'AC-02: Aisha updating Marcus''s profile changes no rows'
);

select is(
  pg_temp.rows_changed($$ update profiles set phone = '0000 000 000' where id = 'a4444444-4444-4444-4444-444444444444' and job_title = 'Enrolled Nurse' $$),
  0,
  'AC-02: nor by matching his job title'
);

-- Her own row after the rejected changes: only the contact columns moved.
select results_eq(
  $$ select job_title, role::text, is_active, phone from profiles where id = 'a3333333-3333-3333-3333-333333333333' $$,
  $$ values ('Registered Nurse'::text, 'carer'::text, true, '0499 999 999'::text) $$,
  'AC-02: her job title, role and active flag are unchanged; her phone is the new one'
);

reset role;
select results_eq(
  $$ select phone from profiles where id = 'a4444444-4444-4444-4444-444444444444' $$,
  $$ values ('0400 000 003'::text) $$,
  'AC-02: Marcus''s phone is unchanged'
);

select * from finish();
rollback;
