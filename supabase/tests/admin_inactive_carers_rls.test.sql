-- [ADM-03] profiles_select_inactive_carers_for_admin (FD-03): an active admin at AAL2 can read
-- inactive carers of their own organisation, and nobody else can read them through this policy.
begin;
select plan(6);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'daniel@example.com'),
  ('a6666666-6666-6666-6666-666666666666', 'marcus@example.com');

insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a5555555-5555-5555-5555-555555555555', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Kelly', false),
  ('a6666666-6666-6666-6666-666666666666', 'carer', '22222222-2222-2222-2222-222222222222', 'Marcus', 'Chen', false);

create or replace function pg_temp.login(p_user_id uuid, p_aal text default 'aal2') returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is((select count(*)::int from profiles where id = 'a5555555-5555-5555-5555-555555555555'), 1,
  'the admin reads their own organisation''s inactive carer');
select is((select count(*)::int from profiles where id = 'a6666666-6666-6666-6666-666666666666'), 0,
  'the admin cannot read another organisation''s inactive carer');

select pg_temp.login('a2222222-2222-2222-2222-222222222222', 'aal1');
select is((select count(*)::int from profiles where id = 'a5555555-5555-5555-5555-555555555555'), 0,
  'an admin without MFA cannot read the inactive carer');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is((select count(*)::int from profiles where id = 'a5555555-5555-5555-5555-555555555555'), 0,
  'a carer colleague cannot read the inactive carer');

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is((select count(*)::int from profiles where id = 'a5555555-5555-5555-5555-555555555555'), 0,
  'another organisation''s admin cannot read the inactive carer');

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select is((select count(*)::int from profiles where id = 'a2222222-2222-2222-2222-222222222222'), 0,
  'the inactive carer still cannot read the admin''s profile');

select * from finish();
rollback;
