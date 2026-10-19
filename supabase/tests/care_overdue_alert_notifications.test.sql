-- [INT-09] Overdue care alert emails: database level.
-- The tracking table's shape and RLS (service role only) and one row per occurrence, identified
-- the way the app identifies one: event id plus original start. The job's behaviour is covered by
-- tests/integration/care-overdue-alerts.test.ts.
begin;
select plan(10);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care');
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com');
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true);
insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells');
insert into care_events (id, client_id, title, starts_at) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Morning medication', '2026-10-05 09:00:00+11');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

select has_table('public', 'care_overdue_alert_notifications', '[INT-09] the table exists');
select columns_are(
  'public', 'care_overdue_alert_notifications',
  array['event_id', 'original_start', 'sent_at'],
  '[INT-09] exactly event_id, original_start and sent_at'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.care_overdue_alert_notifications'::regclass),
  true,
  '[INT-09] RLS is enabled'
);
select is(
  (select count(*)::int from pg_policies where tablename = 'care_overdue_alert_notifications'),
  0,
  '[INT-09] no policies'
);

insert into care_overdue_alert_notifications (event_id, original_start)
  values ('e1111111-1111-1111-1111-111111111111', '2026-10-05 09:00:00+11');
select throws_ok(
  $$insert into care_overdue_alert_notifications (event_id, original_start) values ('e1111111-1111-1111-1111-111111111111', '2026-10-05 09:00:00+11')$$,
  '23505', null,
  '[INT-09][AC-02] one row per occurrence'
);
select lives_ok(
  $$insert into care_overdue_alert_notifications (event_id, original_start) values ('e1111111-1111-1111-1111-111111111111', '2026-10-06 09:00:00+11')$$,
  '[INT-09][AC-02] another occurrence of the same event is its own row'
);
select throws_ok(
  $$insert into care_overdue_alert_notifications (event_id, original_start) values ('99999999-9999-9999-9999-999999999999', '2026-10-05 09:00:00+11')$$,
  '23503', null,
  '[INT-09] a row must belong to a real event'
);

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  'select count(*) from care_overdue_alert_notifications',
  '42501', null,
  '[INT-09][AC-05] a signed-in user cannot query the table'
);
reset role;
set role anon;
select throws_ok(
  'select count(*) from care_overdue_alert_notifications',
  '42501', null,
  '[INT-09][AC-05] anon cannot query the table'
);
reset role;
select is(
  (select count(*)::int from care_overdue_alert_notifications
    where event_id = 'e1111111-1111-1111-1111-111111111111'),
  2,
  '[INT-09] the service role (this session) sees both rows'
);

select * from finish();
rollback;
