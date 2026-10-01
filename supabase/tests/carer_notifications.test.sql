-- [CAR-02] carer_notifications: shift triggers, message text, recipient-only RLS.
-- Covers AC-01 to AC-05 (docs/development/carer-dev/carer-notifications/ACCEPTANCE_CRITERIA.md).
-- Shift times are given in Melbourne (+11, AEDT) and stored as instants, so the messages prove
-- the trigger formats in Australia/Melbourne.
begin;
select plan(23);

insert into organisations (id, name) values ('11111111-1111-1111-1111-111111111111', 'Banksia');
insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Doyle');
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'aisha@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'daniel@example.com');
insert into profiles (id, role, organisation_id, first_name, last_name) values
  ('a1111111-1111-1111-1111-111111111111', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman'),
  ('a2222222-2222-2222-2222-222222222222', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Cho');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.carer_notifications'::regclass),
  'RLS is enabled on carer_notifications');

-- [T-01][AC-01] assigned
insert into shifts (id, client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111',
   'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '2026-12-01 09:00+11', '2026-12-01 11:00+11');

select is(
  (select message from carer_notifications
    where recipient_id = 'a1111111-1111-1111-1111-111111111111' and kind = 'shift_assigned'),
  'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret Doyle).',
  '[T-01] an inserted shift notifies its carer with the exact message');
select results_eq(
  $$select source, kind, read_at is null, client_id, shift_id from carer_notifications
     where recipient_id = 'a1111111-1111-1111-1111-111111111111'$$,
  $$values ('admin'::text, 'shift_assigned'::text, true,
            'b1111111-1111-1111-1111-111111111111'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid)$$,
  '[T-01] source admin, unread, linked to the client and shift');
select is(
  (select count(*)::int from carer_notifications where recipient_id = 'a2222222-2222-2222-2222-222222222222'),
  0, '[T-01] another carer is not notified');

-- [T-02][AC-02] changed
update shifts set starts_at = '2026-12-02 13:00+11', ends_at = '2026-12-02 17:00+11'
  where id = 'c1111111-1111-1111-1111-111111111111';
select is(
  (select message from carer_notifications
    where recipient_id = 'a1111111-1111-1111-1111-111111111111' and kind = 'shift_changed'),
  'Shift changed: Wednesday 2 Dec now 13:00–17:00 (Margaret Doyle).',
  '[T-02] a time change notifies with the new time');
select is(
  (select count(*)::int from carer_notifications where recipient_id = 'a1111111-1111-1111-1111-111111111111'),
  2, '[T-02] two notifications so far');
update shifts set created_by = null where id = 'c1111111-1111-1111-1111-111111111111';
select is(
  (select count(*)::int from carer_notifications where recipient_id = 'a1111111-1111-1111-1111-111111111111'),
  2, '[T-02] an update that changes no time, carer or cancellation notifies nobody');

-- [T-03][AC-03] cancelled (its own shift so the date matches the worked example)
insert into shifts (id, client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111',
   'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '2026-12-04 08:00+11', '2026-12-04 12:00+11');
update shifts set cancelled_at = now() where id = 'c2222222-2222-2222-2222-222222222222';
select is(
  (select message from carer_notifications
    where recipient_id = 'a1111111-1111-1111-1111-111111111111' and kind = 'shift_cancelled'),
  'Shift cancelled: Friday 4 Dec, 08:00–12:00 (Margaret Doyle).',
  '[T-03] cancelling notifies with the shift''s date and time');
update shifts set starts_at = '2026-12-04 09:00+11', ends_at = '2026-12-04 13:00+11'
  where id = 'c2222222-2222-2222-2222-222222222222';
update shifts set cancelled_at = now() where id = 'c2222222-2222-2222-2222-222222222222';
select is(
  (select count(*)::int from carer_notifications
    where recipient_id = 'a1111111-1111-1111-1111-111111111111' and kind = 'shift_cancelled'),
  1, '[T-03] a cancelled shift notifies once; later updates notify nobody');

-- [T-03] a shift inserted already cancelled notifies nobody
insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at, cancelled_at)
  values ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
          '11111111-1111-1111-1111-111111111111', '2026-12-08 09:00+11', '2026-12-08 10:00+11', now());
select is(
  (select count(*)::int from carer_notifications where recipient_id = 'a1111111-1111-1111-1111-111111111111'),
  4, '[T-03] a shift inserted already cancelled adds no notification');

-- [T-04][AC-04] reassignment
insert into shifts (id, client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('c3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111',
   'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '2026-12-10 09:00+11', '2026-12-10 11:00+11');
update shifts set carer_id = 'a2222222-2222-2222-2222-222222222222'
  where id = 'c3333333-3333-3333-3333-333333333333';
select is(
  (select message from carer_notifications
    where recipient_id = 'a1111111-1111-1111-1111-111111111111' and kind = 'shift_cancelled'
      and shift_id = 'c3333333-3333-3333-3333-333333333333'),
  'Shift cancelled: Thursday 10 Dec, 09:00–11:00 (Margaret Doyle).',
  '[T-04] the old carer is told the shift is cancelled');
select is(
  (select message from carer_notifications
    where recipient_id = 'a2222222-2222-2222-2222-222222222222' and kind = 'shift_assigned'),
  'New shift assigned: Thursday 10 Dec, 09:00–11:00 (Margaret Doyle).',
  '[T-04] the new carer is told the shift is assigned');
select is(
  (select count(*)::int from carer_notifications
    where shift_id = 'c3333333-3333-3333-3333-333333333333'),
  3, '[T-04] assigned to Aisha, cancelled for Aisha, assigned to Daniel: three rows');

-- Invoker-rights helper (rolled back with the transaction): counts rows an update touched.
create function public.t_mark_read(p_recipient uuid default null) returns int
language plpgsql as $$
declare n int;
begin
  update carer_notifications set read_at = now()
    where (p_recipient is null and read_at is null) or recipient_id = p_recipient;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- [T-05][AC-05] permissions
select pg_temp.login('a2222222-2222-2222-2222-222222222222');

select is(
  (select count(*)::int from carer_notifications where recipient_id = 'a1111111-1111-1111-1111-111111111111'),
  0, '[T-05] Daniel cannot see Aisha''s notifications');
select is(
  (select count(*)::int from carer_notifications), 1, '[T-05] Daniel sees only his own');
select throws_ok(
  $$insert into carer_notifications (recipient_id, source, kind, message)
    values ('a2222222-2222-2222-2222-222222222222', 'admin', 'shift_assigned', 'forged')$$,
  '42501', null, '[T-05] a carer cannot insert a notification');
select throws_ok(
  $$update carer_notifications set message = 'edited'$$,
  '42501', null, '[T-05] a carer cannot change a message');
select throws_ok(
  $$delete from carer_notifications$$,
  '42501', null, '[T-05] a carer cannot delete a notification');
select is(
  public.t_mark_read('a1111111-1111-1111-1111-111111111111'),
  0, '[T-05] Daniel cannot mark Aisha''s notifications read');
select is(
  public.t_mark_read(),
  1, '[T-05] Daniel can mark his own read');

reset role;
select is(
  (select count(*)::int from carer_notifications
    where recipient_id = 'a1111111-1111-1111-1111-111111111111' and read_at is not null),
  0, '[T-05] Aisha''s rows are still unread');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from carer_notifications), 6, '[T-05] Aisha sees her own six');

reset role;
set local role anon;
select throws_ok(
  $$select count(*) from carer_notifications$$, '42501', null, '[T-05] anon has no access');

select * from finish();
rollback;
