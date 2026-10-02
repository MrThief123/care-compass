-- [INT-11] Pending-cost emails: database level.
-- Table shape and RLS (service role only), one marker per cost, and
-- budget_pending_costs_to_notify() returning pending, un-notified costs only. The job's
-- behaviour is covered by tests/integration/pending-cost-emails.test.ts.
begin;
select plan(14);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care');
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com');
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true);
insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells');
insert into client_family_members (client_id, profile_id) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111');
insert into budget_buckets (id, client_id, name) values
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Government');
insert into budget_fund_entries (bucket_id, client_id, kind, amount, recorded_by, recorded_by_name) values
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'bucket_added', 50, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');

-- One paid, two pending costs.
insert into budget_costs (id, bucket_id, client_id, original_start, description, amount, status, incurred_on, paid_on, recorded_by, recorded_by_name) values
  ('d0000000-0000-0000-0000-000000000001', 'c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', now(), 'Covered', 10, 'paid', budget_today(), budget_today(), 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');
insert into budget_costs (id, bucket_id, client_id, original_start, description, amount, status, incurred_on, recorded_by, recorded_by_name) values
  ('d0000000-0000-0000-0000-000000000002', 'c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', now(), 'Physio', 80, 'pending', budget_today(), 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle'),
  ('d0000000-0000-0000-0000-000000000003', 'c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', now() + interval '1 minute', 'Taxi', 20, 'pending', budget_today(), 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

select has_table('public', 'budget_pending_cost_notifications', '[INT-11] the table exists');
select columns_are(
  'public', 'budget_pending_cost_notifications',
  array['cost_id', 'sent_at'],
  '[INT-11] exactly cost_id and sent_at'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.budget_pending_cost_notifications'::regclass),
  true,
  '[INT-11] RLS is enabled'
);
select is(
  (select count(*)::int from pg_policies where tablename = 'budget_pending_cost_notifications'),
  0,
  '[INT-11] no policies'
);

select is(
  (select count(*)::int from budget_pending_costs_to_notify()
    where cost_id in ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003')),
  2,
  '[INT-11][AC-03] only pending costs are due, the paid one is not'
);
select is(
  (select bucket_name from budget_pending_costs_to_notify() where cost_id = 'd0000000-0000-0000-0000-000000000002'),
  'Government',
  '[INT-11][AC-01] carries the bucket name'
);
select is(
  (select organisation_id from budget_pending_costs_to_notify() where cost_id = 'd0000000-0000-0000-0000-000000000002'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  '[INT-11][AC-05] carries the client''s current organisation id'
);

insert into budget_pending_cost_notifications (cost_id) values ('d0000000-0000-0000-0000-000000000002');
select is(
  (select count(*)::int from budget_pending_costs_to_notify()
    where cost_id = 'd0000000-0000-0000-0000-000000000002'),
  0,
  '[INT-11][AC-02] a cost with a marker is no longer due'
);
select throws_ok(
  $$insert into budget_pending_cost_notifications (cost_id) values ('d0000000-0000-0000-0000-000000000002')$$,
  '23505',
  null,
  '[INT-11][AC-02] one marker per cost'
);

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  'select count(*) from budget_pending_cost_notifications',
  '42501', null,
  '[INT-11][AC-07] a signed-in user cannot query the table'
);
select throws_ok(
  'select * from budget_pending_costs_to_notify()',
  '42501', null,
  '[INT-11][AC-07] a signed-in user cannot call the function'
);
reset role;
set role anon;
select throws_ok(
  'select count(*) from budget_pending_cost_notifications',
  '42501', null,
  '[INT-11][AC-07] anon cannot query the table'
);
select throws_ok(
  'select * from budget_pending_costs_to_notify()',
  '42501', null,
  '[INT-11][AC-07] anon cannot call the function'
);
reset role;
select is(
  (select prosecdef from pg_proc where proname = 'budget_pending_costs_to_notify'),
  true,
  '[INT-11] the function is SECURITY DEFINER'
);

select * from finish();
rollback;
