-- [ADM-08][FD-07] admin_pending_staff_ids: only the caller's own organisation's carers who have
-- not confirmed their invite.
begin;
select plan(6);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email, email_confirmed_at) values
  ('a1111111-1111-1111-1111-111111111111', 'priya@example.test', now()),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.test', now()),
  ('a5555555-5555-5555-5555-555555555555', 'nina@example.test', null),
  ('a4444444-4444-4444-4444-444444444444', 'bob@example.test', null),
  ('a6666666-6666-6666-6666-666666666666', 'fam@example.test', now());

insert into profiles (id, role, organisation_id, first_name, last_name, email) values
  ('a1111111-1111-1111-1111-111111111111', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', 'priya@example.test'),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', 'aisha@example.test'),
  ('a5555555-5555-5555-5555-555555555555', 'carer', '11111111-1111-1111-1111-111111111111', 'Nina', 'Park', 'nina@example.test'),
  ('a4444444-4444-4444-4444-444444444444', 'carer', '22222222-2222-2222-2222-222222222222', 'Bob', 'Diaz', 'bob@example.test'),
  ('a6666666-6666-6666-6666-666666666666', 'family', null, 'Fay', 'Lee', 'fam@example.test');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

select has_function('public', 'admin_pending_staff_ids', 'admin_pending_staff_ids exists');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  (select array_agg(id) from admin_pending_staff_ids() as id),
  array['a5555555-5555-5555-5555-555555555555'::uuid],
  'Priya sees only Nina: the unconfirmed carer in her organisation');
select is(
  (select count(*)::int from admin_pending_staff_ids() as id where id = 'a3333333-3333-3333-3333-333333333333'),
  0, 'a carer who has confirmed is not pending');
select is(
  (select count(*)::int from admin_pending_staff_ids() as id where id = 'a4444444-4444-4444-4444-444444444444'),
  0, 'another organisation''s unconfirmed carer is not listed');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok($$select * from admin_pending_staff_ids()$$, '42501', null, 'a carer cannot call it');

reset role;
set local role anon;
select throws_ok($$select * from admin_pending_staff_ids()$$, '42501', null, 'anon cannot call it');

select * from finish();
rollback;
