-- [FAM-11] Family — Update funds (Edit budget)
-- Covers AC-10 to AC-12 (docs/development/family-dev/family-budget-update-funds/ACCEPTANCE_CRITERIA.md) for
-- charge_ended_event_occurrences(client, items): charges a plain event's ended occurrences once (FD-07), and for
-- care_events.cost_set_at, which set_event_cost stamps so an event is never charged for time before its cost.
begin;
select plan(15);

insert into organisations (id, name) values ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care');
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'rosa@example.com');
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a5555555-5555-5555-5555-555555555555', 'family', null, 'Rosa', 'Doyle', true);
insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells', '1945-03-01'),
  ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Robert', 'Doyle', '1950-05-05');
insert into client_family_members (client_id, profile_id) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555');
insert into shifts (client_id, carer_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour');

-- Two buckets: one with $100 funds, one with $10.
insert into budget_buckets (id, client_id, name) values
  ('c0000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'NDIS'),
  ('c0000000-0000-0000-0000-000000000002', 'b1111111-1111-1111-1111-111111111111', 'Small');
insert into budget_fund_entries (bucket_id, client_id, kind, amount, recorded_by, recorded_by_name) values
  ('c0000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'funds_added', 100, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle'),
  ('c0000000-0000-0000-0000-000000000002', 'b1111111-1111-1111-1111-111111111111', 'funds_added', 10, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');

-- A plain event that started two hours ago ($30, NDIS), one for $40 from the $10 bucket, and a cost-free one.
insert into care_events (id, client_id, title, starts_at, completion_mode) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Physio', date_trunc('second', now() - interval '2 hours'), 'automatic'),
  ('e2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Taxi', date_trunc('second', now() - interval '2 hours'), 'automatic'),
  ('e3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Walk', date_trunc('second', now() - interval '2 hours'), 'automatic');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- cost_set_at: stamped by set_event_cost, cleared with the cost.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select set_event_cost('e1111111-1111-1111-1111-111111111111', 30, 'c0000000-0000-0000-0000-000000000001');
select set_event_cost('e2222222-2222-2222-2222-222222222222', 40, 'c0000000-0000-0000-0000-000000000002');
reset role;
select ok((select cost_set_at is not null from care_events where id = 'e1111111-1111-1111-1111-111111111111'),
  '[FAM-11][AC-10] set_event_cost stamps cost_set_at');
-- Make the cost "set" an hour before the event started, so the first occurrence counts (the test clock is one transaction).
update care_events set cost_set_at = now() - interval '3 hours' where id in ('e1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222');

-- AC-12: a carer and another client's family are refused.
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok($$select charge_ended_event_occurrences('b1111111-1111-1111-1111-111111111111',
  jsonb_build_array(jsonb_build_object('event_id','e1111111-1111-1111-1111-111111111111','original_start',(date_trunc('second', now() - interval '2 hours'))::text)))$$,
  '42501', null, '[FAM-11][AC-12] a carer cannot charge');
reset role;
select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select throws_ok($$select charge_ended_event_occurrences('b1111111-1111-1111-1111-111111111111', '[]'::jsonb)$$,
  '42501', null, '[FAM-11][AC-12] another client''s family cannot charge');
reset role;
select is((select count(*) from budget_costs where event_id in ('e1111111-1111-1111-1111-111111111111','e2222222-2222-2222-2222-222222222222','e3333333-3333-3333-3333-333333333333')), 0::bigint, '[FAM-11][AC-12] nothing charged by the refused calls');

-- AC-10: Helen's call charges the ended occurrence once.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  charge_ended_event_occurrences('b1111111-1111-1111-1111-111111111111',
    jsonb_build_array(jsonb_build_object('event_id','e1111111-1111-1111-1111-111111111111','original_start',(date_trunc('second', now() - interval '2 hours'))::text))),
  1, '[FAM-11][AC-10] one occurrence charged');
reset role;
select is((select amount from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111'), 30.00::numeric, '[FAM-11][AC-10] the cost is the event''s cost');
select is((select status from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111'), 'paid', '[FAM-11][AC-10] paid when the bucket covers it');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where bucket_id = 'c0000000-0000-0000-0000-000000000001'), 70.00::numeric, '[FAM-11][AC-10] the bucket drops by the cost');
select is((select recorded_by_name from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111'), 'Helen Doyle', '[FAM-11][AC-10] recorded under the signed-in person');

-- Again: charged once only.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  charge_ended_event_occurrences('b1111111-1111-1111-1111-111111111111',
    jsonb_build_array(jsonb_build_object('event_id','e1111111-1111-1111-1111-111111111111','original_start',(date_trunc('second', now() - interval '2 hours'))::text))),
  0, '[FAM-11][AC-10] a second call charges nothing');
reset role;
select is((select count(*) from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111'), 1::bigint, '[FAM-11][AC-10] still one cost row');

-- A bucket that cannot cover it holds it whole as pending.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select charge_ended_event_occurrences('b1111111-1111-1111-1111-111111111111',
  jsonb_build_array(jsonb_build_object('event_id','e2222222-2222-2222-2222-222222222222','original_start',(date_trunc('second', now() - interval '2 hours'))::text)));
reset role;
select is((select status from budget_costs where event_id = 'e2222222-2222-2222-2222-222222222222'), 'pending', '[FAM-11][AC-10] held pending when the bucket cannot cover it');

-- AC-11: no cost, a future occurrence, or one from before the cost was set: nothing charged.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  charge_ended_event_occurrences('b1111111-1111-1111-1111-111111111111', jsonb_build_array(
    jsonb_build_object('event_id','e3333333-3333-3333-3333-333333333333','original_start',(date_trunc('second', now() - interval '2 hours'))::text),
    jsonb_build_object('event_id','e1111111-1111-1111-1111-111111111111','original_start',(date_trunc('second', now() + interval '1 day'))::text),
    jsonb_build_object('event_id','e1111111-1111-1111-1111-111111111111','original_start',(date_trunc('second', now() - interval '5 hours'))::text))),
  0, '[FAM-11][AC-11] no cost, future, or before the cost was set: nothing charged');
reset role;
select is((select count(*) from budget_costs where event_id in ('e1111111-1111-1111-1111-111111111111','e2222222-2222-2222-2222-222222222222','e3333333-3333-3333-3333-333333333333')), 2::bigint, '[FAM-11][AC-11] still only the two earlier costs');

-- Helen cannot charge against another client either.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok($$select charge_ended_event_occurrences('b2222222-2222-2222-2222-222222222222', '[]'::jsonb)$$,
  '42501', null, '[FAM-11][AC-12] family of one client cannot charge another''s');
reset role;

select * from finish();
rollback;
