-- [ADM-03] FD-08: an admin cannot create a shift for a deactivated carer (shifts_insert_admin).
begin;
select plan(3);

insert into organisations (id, name) values ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care');
insert into auth.users (id, email) values
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'daniel@example.com');
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a5555555-5555-5555-5555-555555555555', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Kelly', false);
insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Doyle', '1950-01-01');

select set_config('request.jwt.claim.sub', 'a2222222-2222-2222-2222-222222222222', true);
select set_config('request.jwt.claims', '{"sub":"a2222222-2222-2222-2222-222222222222","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;

select lives_ok($$insert into shifts (carer_id, client_id, starts_at, ends_at)
  values ('a3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', now() + interval '1 day', now() + interval '1 day 1 hour')$$,
  '[ADM-03] an admin can give an active carer a shift');

select throws_ok($$insert into shifts (carer_id, client_id, starts_at, ends_at)
  values ('a5555555-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', now() + interval '2 days', now() + interval '2 days 1 hour')$$,
  '42501', null, '[ADM-03] an admin cannot give a deactivated carer a shift');

select is((select count(*)::int from shifts where carer_id = 'a5555555-5555-5555-5555-555555555555'), 0,
  '[ADM-03] no shift exists for the deactivated carer');

select * from finish();
rollback;
