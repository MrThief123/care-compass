-- [CAR-05] get_carer_shifts: own non-cancelled shifts in [from, to), names only, caller only.
begin;
select plan(6);

insert into organisations (id, name) values ('11111111-1111-1111-1111-111111111111', 'Banksia');
insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Doyle');
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'aisha@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'daniel@example.com');
insert into profiles (id, role, organisation_id, first_name, last_name) values
  ('a1111111-1111-1111-1111-111111111111', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman'),
  ('a2222222-2222-2222-2222-222222222222', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Cho');
insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at, cancelled_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2020-01-06 08:00+11', '2020-01-06 12:00+11', null),
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2020-01-07 08:00+11', '2020-01-07 12:00+11', now()),
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2020-01-13 08:00+11', '2020-01-13 12:00+11', null),
  ('b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2020-01-06 09:00+11', '2020-01-06 10:00+11', null);

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select is(
  (select count(*)::int from get_carer_shifts('a1111111-1111-1111-1111-111111111111', '2020-01-05 13:00+00', '2020-01-12 13:00+00')),
  1, 'own non-cancelled shift in the window is returned (cancelled and out-of-window are not)');
select is(
  (select client_first_name || ' ' || client_last_name from get_carer_shifts('a1111111-1111-1111-1111-111111111111', '2020-01-05 13:00+00', '2020-01-12 13:00+00')),
  'Margaret Doyle', 'ended shift still names the client');
select is(
  (select count(*)::int from clients), 0, 'RLS hides the client row (PD-041) so the function is what names it');
select is(
  (select count(*)::int from get_carer_shifts('a1111111-1111-1111-1111-111111111111', '2020-01-05 21:00+00', '2020-01-06 01:00+00')),
  1, 'start is inclusive of p_from, exclusive of p_to');
select is(
  (select count(*)::int from get_carer_shifts('a2222222-2222-2222-2222-222222222222', '2020-01-01 00:00+00', '2021-01-01 00:00+00')),
  0, 'another carer id returns nothing');

reset role;
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
set local role anon;
select throws_ok(
  $$select * from get_carer_shifts('a1111111-1111-1111-1111-111111111111', '2020-01-01', '2021-01-01')$$,
  '42501', null, 'anon cannot execute');

select * from finish();
rollback;
