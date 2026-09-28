-- [F0-12] Budget buckets, fund entries, event costs and the summary
-- Covers AC-01 to AC-05 and AC-07 to AC-15 at the database level
-- (docs/development/shared/shared-budget-schema/ACCEPTANCE_CRITERIA.md). AC-06 (money schema) is TypeScript.
-- Rules under test: PD-032 (75 / 85 / 100), PD-034 + PD-058 (family and admins change the budget, carers
-- never), PD-059 (open buckets), PD-060 (pending costs are paid whole, oldest first), FD-02 (an event's
-- deletion never deletes a cost; a pending cost carries over until paid).
begin;
select plan(163);

-- ---------------------------------------------------------------------------
-- Seed: two organisations, six people, two clients, one costed event
-- ---------------------------------------------------------------------------
insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'dan@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'rosa@example.com'),
  ('a6666666-6666-6666-6666-666666666666', 'omar@example.com');

-- Helen (family, Margaret), Priya (admin, Banksia), Aisha (carer, assigned to Margaret),
-- Dan (carer, Banksia, not assigned), Rosa (family, Robert), Omar (admin, Wattle)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'carer', '11111111-1111-1111-1111-111111111111', 'Dan', 'Wu', true),
  ('a5555555-5555-5555-5555-555555555555', 'family', null, 'Rosa', 'Doyle', true),
  ('a6666666-6666-6666-6666-666666666666', 'admin', '22222222-2222-2222-2222-222222222222', 'Omar', 'Said', true);

insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells', '1945-03-01'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Robert', 'Doyle', '1950-05-05');

insert into client_family_members (client_id, profile_id) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555');

-- `carer_client_assignments` is retired (F0-18, PD-041): read access derives solely from
-- an active, uncancelled shift, so this row alone is what grants Aisha access to Margaret.
insert into shifts (client_id, carer_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour');

-- e1 Morning medication: a weekly task for Margaret (its cost is set per scenario)
-- e2 Afternoon walk: a daily task for Margaret (used for the bucket-removal scenario)
insert into care_events (id, client_id, title, starts_at, recurrence, completion_mode, created_by) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Morning medication', '2026-11-30 09:00:00+11', '{"frequency":"weekly","interval":1}', 'manual', 'a1111111-1111-1111-1111-111111111111'),
  ('e2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Afternoon walk', '2026-11-30 14:00:00+11', '{"frequency":"daily","interval":1}', 'manual', 'a1111111-1111-1111-1111-111111111111');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

create or replace function pg_temp.bid(p_n int) returns uuid as $$
  select ('c0000000-0000-0000-0000-' || lpad(p_n::text, 12, '0'))::uuid;
$$ language sql;

-- Seed one Margaret (or given client) bucket as the table owner: funds added, and one paid cost.
create or replace function pg_temp.seed_bucket(p_n int, p_name text, p_funds numeric, p_paid numeric, p_client uuid default 'b1111111-1111-1111-1111-111111111111') returns void as $$
begin
  insert into budget_buckets (id, client_id, name) values (pg_temp.bid(p_n), p_client, p_name);
  if p_funds > 0 then
    insert into budget_fund_entries (bucket_id, client_id, kind, amount, recorded_by, recorded_by_name)
    values (pg_temp.bid(p_n), p_client, 'funds_added', p_funds, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');
  end if;
  if p_paid > 0 then
    insert into budget_costs (bucket_id, client_id, description, amount, status, original_start, incurred_on, paid_on, recorded_by, recorded_by_name)
    values (pg_temp.bid(p_n), p_client, 'Seeded cost', p_paid, 'paid', '2026-01-05 09:00:00+11', (now() at time zone 'Australia/Melbourne')::date, (now() at time zone 'Australia/Melbourne')::date, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');
  end if;
end;
$$ language plpgsql;

-- Seed one pending cost (no event) on a bucket.
create or replace function pg_temp.seed_pending(p_n int, p_amount numeric, p_day text, p_incurred date default '2026-01-01') returns void as $$
begin
  insert into budget_costs (bucket_id, client_id, description, amount, status, original_start, incurred_on, recorded_by, recorded_by_name)
  values (pg_temp.bid(p_n), 'b1111111-1111-1111-1111-111111111111', 'Pending ' || p_day, p_amount, 'pending', (p_day || ' 09:00:00+11')::timestamptz, p_incurred, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');
end;
$$ language plpgsql;

select pg_temp.seed_bucket(1, 'NDIS', 24000, 9120);
select pg_temp.seed_bucket(2, 'Government', 3000, 2760);
select pg_temp.seed_bucket(3, 'p74', 10000, 7400);
select pg_temp.seed_bucket(4, 'p75', 10000, 7500);
select pg_temp.seed_bucket(5, 'p85', 10000, 8500);
select pg_temp.seed_bucket(6, 'p100', 10000, 10000);
select pg_temp.seed_bucket(7, 'Zero', 0, 0);
select pg_temp.seed_bucket(8, 'rf', 500, 0);
select pg_temp.seed_bucket(9, 'val', 100, 0);
select pg_temp.seed_bucket(10, 'ev', 100, 0);
select pg_temp.seed_bucket(11, 'st', 0, 0);
select pg_temp.seed_bucket(12, 'st2', 0, 0);
select pg_temp.seed_bucket(13, 'old', 0, 0);
select pg_temp.seed_bucket(14, 'rm2', 50, 0);
select pg_temp.seed_bucket(15, 'st3', 0, 0);
select pg_temp.seed_bucket(17, 'rm3', 0, 0);
select pg_temp.seed_bucket(18, 'mo', 1000, 100);
select pg_temp.seed_bucket(19, 'moex', 300, 0);
-- Paid last month: $400 on mo (with its $100 this month), $300 on moex (all of it).
insert into budget_costs (bucket_id, client_id, description, amount, status, original_start, incurred_on, paid_on, recorded_by, recorded_by_name) values
  (pg_temp.bid(18), 'b1111111-1111-1111-1111-111111111111', 'Last month', 400, 'paid', '2026-01-06 09:00:00+11', (date_trunc('month', now() at time zone 'Australia/Melbourne') - interval '1 day')::date, (date_trunc('month', now() at time zone 'Australia/Melbourne') - interval '1 day')::date, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle'),
  (pg_temp.bid(19), 'b1111111-1111-1111-1111-111111111111', 'Last month', 300, 'paid', '2026-01-06 09:00:00+11', (date_trunc('month', now() at time zone 'Australia/Melbourne') - interval '1 day')::date, (date_trunc('month', now() at time zone 'Australia/Melbourne') - interval '1 day')::date, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');
select pg_temp.seed_bucket(16, 'Robert bucket', 500, 0, 'b2222222-2222-2222-2222-222222222222');

-- st: pending 40 (oldest), 10, 30. st2: pending 60, then 10. old: pending since 2024. st3: one pending, for the update test.
select pg_temp.seed_pending(11, 40, '2026-01-01', '2026-01-01');
select pg_temp.seed_pending(11, 10, '2026-01-02', '2026-01-02');
select pg_temp.seed_pending(11, 30, '2026-01-03', '2026-01-03');
select pg_temp.seed_pending(12, 60, '2026-01-01', '2026-01-01');
select pg_temp.seed_pending(12, 10, '2026-01-02', '2026-01-02');
select pg_temp.seed_pending(13, 25, '2024-03-01', '2024-03-01');
select pg_temp.seed_pending(15, 15, '2026-01-01', '2026-01-01');

-- ---------------------------------------------------------------------------
-- AC-01 / AC-02: the summary (as Helen, so RLS applies to the function)
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'NDIS'), 14880.00::numeric,
  '[F0-12][AC-01] $24,000 funds less $9,120 paid leaves 14880.00');
select is((select percent_used from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'NDIS'), 38::numeric,
  '[F0-12][AC-01] percent used is 38');
select is((select total from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'NDIS'), 24000.00::numeric,
  '[F0-12][AC-01] total is the sum of the fund entries');

select is((select percent_used from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'Government'), 92::numeric,
  '[F0-12][AC-02] $2,760 of $3,000 is 92 percent');
select is((select threshold_state from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'Government'), 'alert',
  '[F0-12][AC-02] 92 percent is alert');
select is((select threshold_state from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'p74'), 'normal',
  '[F0-12][AC-02] 74 percent is normal');
select is((select threshold_state from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'p75'), 'warning',
  '[F0-12][AC-02] 75 percent is warning');
select is((select threshold_state from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'p85'), 'alert',
  '[F0-12][AC-02] 85 percent is alert');
select is((select threshold_state from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'p100'), 'depleted',
  '[F0-12][AC-02] 100 percent is depleted');
select is((select percent_used from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'Zero'), null::numeric,
  '[F0-12][AC-02] a bucket with no funds has a null percent');
select is((select threshold_state from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'Zero'), 'normal',
  '[F0-12][AC-02] a bucket with no funds and no pending cost is normal');

-- ---------------------------------------------------------------------------
-- AC-18: a month is the period; the balance carries over (FD-02, human 2026-09-27)
-- ---------------------------------------------------------------------------
select is((select period_start from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'mo'), date_trunc('month', now() at time zone 'Australia/Melbourne')::date,
  '[F0-12][AC-18] the period starts on the 1st of this month, Melbourne time');
select is((select period_end from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'mo'), (date_trunc('month', now() at time zone 'Australia/Melbourne') + interval '1 month - 1 day')::date,
  '[F0-12][AC-18] and ends on the last day of it');
select is((select total from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'mo'), 1000.00::numeric, '[F0-12][AC-18] total is cumulative: funds carry over');
select is((select used from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'mo'), 500.00::numeric, '[F0-12][AC-18] used counts every paid cost, last month''s too');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'mo'), 500.00::numeric, '[F0-12][AC-18] remaining carries over: 1000 less 500');
select is((select period_used from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'mo'), 100.00::numeric, '[F0-12][AC-18] period_used is this month''s paid costs only');
select is((select percent_used from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'mo'), 17::numeric, '[F0-12][AC-18] percent is this month''s $100 of the $600 available at the month''s start');
select is((select threshold_state from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'mo'), 'normal', '[F0-12][AC-18] 17 percent is normal');
select is((select percent_used from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'moex'), null::numeric, '[F0-12][AC-18] a bucket spent entirely last month has no funds to measure this month against');
select is((select threshold_state from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'moex'), 'depleted', '[F0-12][AC-18] but is depleted: its funds are gone');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'moex'), 0.00::numeric, '[F0-12][AC-18] with 0.00 remaining');

-- ---------------------------------------------------------------------------
-- AC-03: a removal cannot exceed the balance
-- ---------------------------------------------------------------------------
select throws_ok(
  format($$ select remove_funds(%L, 500.01) $$, pg_temp.bid(8)),
  '22023', 'Only $500.00 available',
  '[F0-12][AC-03] removing more than the balance is refused with the amount available');
select is((select count(*) from budget_fund_entries where bucket_id = pg_temp.bid(8)), 1::bigint,
  '[F0-12][AC-03] the refused removal inserted nothing');
select lives_ok(format($$ select remove_funds(%L, 500.00) $$, pg_temp.bid(8)),
  '[F0-12][AC-03] removing exactly the balance succeeds');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'rf'), 0.00::numeric,
  '[F0-12][AC-03] remaining is 0.00, never negative');

-- ---------------------------------------------------------------------------
-- AC-04: amounts are validated, and nothing is inserted on failure
-- ---------------------------------------------------------------------------
select throws_ok(format($$ select add_funds(%L, 0) $$, pg_temp.bid(9)), '22023', null, '[F0-12][AC-04] add_funds refuses 0');
select throws_ok(format($$ select add_funds(%L, -5) $$, pg_temp.bid(9)), '22023', null, '[F0-12][AC-04] add_funds refuses -5');
select throws_ok(format($$ select add_funds(%L, 12.345) $$, pg_temp.bid(9)), '22023', null, '[F0-12][AC-04] add_funds refuses 3 decimal places');
select throws_ok(format($$ select remove_funds(%L, 0) $$, pg_temp.bid(9)), '22023', null, '[F0-12][AC-04] remove_funds refuses 0');
select throws_ok(format($$ select remove_funds(%L, -5) $$, pg_temp.bid(9)), '22023', null, '[F0-12][AC-04] remove_funds refuses -5');
select throws_ok(format($$ select remove_funds(%L, 12.345) $$, pg_temp.bid(9)), '22023', null, '[F0-12][AC-04] remove_funds refuses 3 decimal places');
select is((select count(*) from budget_fund_entries where bucket_id = pg_temp.bid(9)), 1::bigint,
  '[F0-12][AC-04] the refused calls inserted nothing');

-- ---------------------------------------------------------------------------
-- AC-07: completing an occurrence charges the event's cost, once
-- ---------------------------------------------------------------------------
reset role;
update care_events set cost = 40, bucket_id = pg_temp.bid(10) where id = 'e1111111-1111-1111-1111-111111111111';
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select lives_ok($$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-11-30 09:00:00+11') $$,
  '[F0-12][AC-07] completing a costed occurrence works');
select is((select status || ':' || amount from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-11-30 09:00:00+11'), 'paid:40.00',
  '[F0-12][AC-07] the cost is recorded as paid');
select is((select paid_on from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-11-30 09:00:00+11'), (now() at time zone 'Australia/Melbourne')::date,
  '[F0-12][AC-07] paid_on is today in Melbourne');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'ev'), 60.00::numeric,
  '[F0-12][AC-07] remaining is 60.00');
select lives_ok($$ select set_occurrence_undone('e1111111-1111-1111-1111-111111111111', '2026-11-30 09:00:00+11') $$,
  '[F0-12][AC-07] the completion can be undone');
select lives_ok($$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-11-30 09:00:00+11') $$,
  '[F0-12][AC-07] and completed again');
select is((select count(*) from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111'), 1::bigint,
  '[F0-12][AC-07] the occurrence was charged once, not twice');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'ev'), 60.00::numeric,
  '[F0-12][AC-07] remaining is still 60.00 after undo and redo');
select lives_ok($$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-07 09:00:00+11') $$,
  '[F0-12][AC-07] a second occurrence completes');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'ev'), 20.00::numeric,
  '[F0-12][AC-07] a recurring event is charged again for the next occurrence');

-- ---------------------------------------------------------------------------
-- AC-08: a cost the bucket cannot cover is held pending, whole
-- ---------------------------------------------------------------------------
select lives_ok($$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-14 09:00:00+11') $$,
  '[F0-12][AC-08] an occurrence the bucket cannot cover still completes');
select is((select action from care_event_completions where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-12-14 09:00:00+11' order by seq desc limit 1), 'done',
  '[F0-12][AC-08] it is Done');
select is((select status || ':' || amount from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-12-14 09:00:00+11'), 'pending:40.00',
  '[F0-12][AC-08] the whole $40 is pending, nothing part-paid');
select is((select paid_on from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-12-14 09:00:00+11'), null::date,
  '[F0-12][AC-08] a pending cost has no paid_on');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'ev'), 20.00::numeric,
  '[F0-12][AC-08] remaining is unchanged by a pending cost');
select is((select pending_total from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'ev'), 40.00::numeric,
  '[F0-12][AC-08] pending_total is 40.00');
select is((select pending_count from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'ev'), 1::bigint,
  '[F0-12][AC-08] pending_count is 1');
select is((select threshold_state from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'ev'), 'depleted',
  '[F0-12][AC-08] a bucket with a pending cost is depleted');

reset role;
update care_events set cost = 5 where id = 'e1111111-1111-1111-1111-111111111111';
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok($$ select set_occurrence_done('e1111111-1111-1111-1111-111111111111', '2026-12-21 09:00:00+11') $$,
  '[F0-12][AC-08] a later, smaller cost completes');
select is((select status from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-12-21 09:00:00+11'), 'pending',
  '[F0-12][AC-08] it is pending too, even though $20 could cover $5, while an older cost is pending');
select is((select amount from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-12-14 09:00:00+11'), 40.00::numeric,
  '[F0-12][AC-08] the earlier cost keeps its $40: a change to the event applies to future completions only');
select is((select pending_count from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'ev'), 2::bigint,
  '[F0-12][AC-08] two costs are pending');

-- ---------------------------------------------------------------------------
-- AC-09: adding funds pays pending costs whole, oldest first
-- ---------------------------------------------------------------------------
select lives_ok(format($$ select add_funds(%L, 45) $$, pg_temp.bid(11)), '[F0-12][AC-09] adding $45 works');
select is((select status from budget_costs where bucket_id = pg_temp.bid(11) and amount = 40), 'paid', '[F0-12][AC-09] the oldest, $40, is paid');
select is((select paid_on from budget_costs where bucket_id = pg_temp.bid(11) and amount = 40), (now() at time zone 'Australia/Melbourne')::date, '[F0-12][AC-09] with paid_on today');
select is((select status from budget_costs where bucket_id = pg_temp.bid(11) and amount = 10), 'pending', '[F0-12][AC-09] the $10 cost is not yet paid: only $5 is left');
select is((select status from budget_costs where bucket_id = pg_temp.bid(11) and amount = 30), 'pending', '[F0-12][AC-09] the $30 cost stays pending');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'st'), 5.00::numeric, '[F0-12][AC-09] remaining is 5.00');
select is((select count(*) from budget_fund_entries where bucket_id = pg_temp.bid(11)), 1::bigint, '[F0-12][AC-09] paying a cost adds no History row');
select lives_ok(format($$ select add_funds(%L, 5) $$, pg_temp.bid(11)), '[F0-12][AC-09] adding $5 more works');
select is((select status from budget_costs where bucket_id = pg_temp.bid(11) and amount = 10), 'paid', '[F0-12][AC-09] now the $10 cost is paid');
select is((select status from budget_costs where bucket_id = pg_temp.bid(11) and amount = 30), 'pending', '[F0-12][AC-09] and the $30 cost stays pending');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'st'), 0.00::numeric, '[F0-12][AC-09] remaining is 0.00');

select lives_ok(format($$ select add_funds(%L, 45) $$, pg_temp.bid(12)), '[F0-12][AC-09] adding $45 to a bucket whose oldest cost is $60 works');
select is((select count(*) from budget_costs where bucket_id = pg_temp.bid(12) and status = 'pending'), 2::bigint,
  '[F0-12][AC-09] the newer $10 cost does not jump the older $60 cost');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'st2'), 45.00::numeric, '[F0-12][AC-09] remaining is 45.00');

-- ---------------------------------------------------------------------------
-- AC-13: a pending cost carries over until paid
-- ---------------------------------------------------------------------------
select is((select status from budget_costs where bucket_id = pg_temp.bid(13)), 'pending', '[F0-12][AC-13] a cost pending since 2024 is still pending');
select lives_ok(format($$ select add_funds(%L, 100) $$, pg_temp.bid(13)), '[F0-12][AC-13] a later top-up works');
select is((select status from budget_costs where bucket_id = pg_temp.bid(13)), 'paid', '[F0-12][AC-13] and pays it');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'old'), 75.00::numeric, '[F0-12][AC-13] remaining is 100 less the 25 paid');

select lives_ok(format($$ select add_funds(%L, 100) $$, pg_temp.bid(10)), '[F0-12][AC-13] topping up the event bucket works');
select is((select count(*) from budget_costs where bucket_id = pg_temp.bid(10) and status = 'pending'), 0::bigint, '[F0-12][AC-13] both pending event costs are paid');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'ev'), 75.00::numeric, '[F0-12][AC-13] 200 in, 40 + 40 + 40 + 5 out, leaves 75.00');

-- ---------------------------------------------------------------------------
-- AC-10: bucket names, starting amounts, renames
-- ---------------------------------------------------------------------------
select lives_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', 'Council grant', 0) $$, '[F0-12][AC-10] a bucket with a $0 start is added');
select is((select e.kind || ':' || e.amount from budget_fund_entries e join budget_buckets b on b.id = e.bucket_id where b.name = 'Council grant'), 'bucket_added:0.00',
  '[F0-12][AC-10] it records "bucket_added" with 0.00');
select throws_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', '  council GRANT ', 10) $$, '23505', null, '[F0-12][AC-10] a name is unique ignoring case and spaces');
select throws_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', '', 10) $$, '22023', null, '[F0-12][AC-10] a name is required');
select throws_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', '   ', 10) $$, '22023', null, '[F0-12][AC-10] a blank name is refused');
select throws_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', repeat('x', 41), 10) $$, '22023', null, '[F0-12][AC-10] a name over 40 characters is refused');
select lives_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', repeat('x', 40), 10) $$, '[F0-12][AC-10] a name of exactly 40 is accepted');
select lives_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', 'Gift', 250.00, 'ndis') $$, '[F0-12][AC-10] a bucket with a starting amount and a kind is added');
select is((select e.kind || ':' || e.amount from budget_fund_entries e join budget_buckets b on b.id = e.bucket_id where b.name = 'Gift'), 'bucket_added:250.00',
  '[F0-12][AC-10] it records the starting amount');
select throws_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', 'Odd', 10, 'pension') $$, '23514', null, '[F0-12][AC-10] a kind must be ndis, fixed or government');
select throws_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', 'Odd', -1) $$, '22023', null, '[F0-12][AC-10] a negative starting amount is refused');
select throws_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', 'Odd', 12.345) $$, '22023', null, '[F0-12][AC-10] a starting amount has at most 2 decimal places');
select lives_ok($$ select rename_bucket((select id from budget_buckets where name = 'Gift'), 'Gift fund') $$, '[F0-12][AC-10] a bucket is renamed');
select is((select count(*) from budget_fund_entries where bucket_id = (select id from budget_buckets where name = 'Gift fund')), 1::bigint, '[F0-12][AC-10] a rename records no History row');
select is((select total from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'Gift fund'), 250.00::numeric, '[F0-12][AC-10] its entries stay attached under the new name');
select throws_ok($$ select rename_bucket((select id from budget_buckets where name = 'Gift fund'), 'COUNCIL grant') $$, '23505', null, '[F0-12][AC-10] a rename cannot take another bucket''s name');

-- ---------------------------------------------------------------------------
-- AC-11: removing a bucket
-- ---------------------------------------------------------------------------
reset role;
update care_events set cost = 10, bucket_id = pg_temp.bid(14) where id = 'e2222222-2222-2222-2222-222222222222';
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select lives_ok(format($$ select remove_bucket(%L, 'closed') $$, pg_temp.bid(14)), '[F0-12][AC-11] a bucket with no costs is removed');
select is((select kind || ':' || amount from budget_fund_entries where bucket_id = pg_temp.bid(14) and kind = 'bucket_removed'), 'bucket_removed:-50.00',
  '[F0-12][AC-11] the money left is recorded as minus $50');
select is((select count(*) from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'rm2'), 0::bigint, '[F0-12][AC-11] the bucket no longer appears in the summary');
select is((select count(*) from budget_fund_entries where bucket_id = pg_temp.bid(14)), 2::bigint, '[F0-12][AC-11] its History stays');
select is((select b.name from care_events e join budget_buckets b on b.id = e.bucket_id where e.id = 'e2222222-2222-2222-2222-222222222222'), 'Miscellaneous',
  '[F0-12][AC-11] events that pointed at it move to a Miscellaneous bucket');
select is((select cost from care_events where id = 'e2222222-2222-2222-2222-222222222222'), 10.00::numeric,
  '[F0-12][AC-11] and keep their cost, so future completions still cost');
select is((select e.kind || ':' || e.amount from budget_fund_entries e join budget_buckets b on b.id = e.bucket_id where b.name = 'Miscellaneous'), 'bucket_added:0.00',
  '[F0-12][AC-11] the Miscellaneous bucket is created with a $0 start');
reset role;
update care_events set bucket_id = pg_temp.bid(17) where id = 'e2222222-2222-2222-2222-222222222222';
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(format($$ select remove_bucket(%L) $$, pg_temp.bid(17)), '[F0-12][AC-11] a second bucket with an event is removed');
select is((select count(*) from budget_buckets where client_id = 'b1111111-1111-1111-1111-111111111111' and name = 'Miscellaneous' and removed_at is null), 1::bigint,
  '[F0-12][AC-11] the existing Miscellaneous bucket is reused, not duplicated');
select is((select b.name from care_events e join budget_buckets b on b.id = e.bucket_id where e.id = 'e2222222-2222-2222-2222-222222222222'), 'Miscellaneous',
  '[F0-12][AC-11] and the event moved into it');
select lives_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', 'rm2', 0) $$, '[F0-12][AC-11] the removed name can be used again');
select throws_ok(format($$ select remove_bucket(%L) $$, pg_temp.bid(14)), '22023', null, '[F0-12][AC-11] a removed bucket cannot be removed again');
select throws_ok(format($$ select remove_bucket(%L) $$, pg_temp.bid(10)), '22023', null, '[F0-12][AC-11] a bucket with costs cannot be removed');
select throws_ok(format($$ select remove_bucket(%L) $$, pg_temp.bid(12)), '22023', null, '[F0-12][AC-11] nor one with a pending cost');

-- ---------------------------------------------------------------------------
-- AC-15: who did it, and the note
-- ---------------------------------------------------------------------------
select lives_ok(format($$ select add_funds(%L, 10, 'Quarterly top-up') $$, pg_temp.bid(9)), '[F0-12][AC-15] adding funds with a note works');
select is((select recorded_by from budget_fund_entries where bucket_id = pg_temp.bid(9) and note = 'Quarterly top-up'), 'a1111111-1111-1111-1111-111111111111'::uuid, '[F0-12][AC-15] the row records the signed-in user');
select is((select recorded_by_name from budget_fund_entries where bucket_id = pg_temp.bid(9) and note = 'Quarterly top-up'), 'Helen Doyle', '[F0-12][AC-15] and a snapshot of their name');
select is((select recorded_by from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111' and original_start = '2026-11-30 09:00:00+11'), 'a1111111-1111-1111-1111-111111111111'::uuid, '[F0-12][AC-15] a charged cost records who completed the occurrence');
select is((select count(*) from pg_proc where proname in ('add_funds', 'remove_funds', 'add_bucket', 'rename_bucket', 'remove_bucket') and 'p_actor_id' = any (proargnames)), 0::bigint, '[F0-12][AC-15] no change function takes the actor as a parameter');

-- ---------------------------------------------------------------------------
-- AC-05: who can read and who can change
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select lives_ok(format($$ select add_funds(%L, 10) $$, pg_temp.bid(9)), '[F0-12][AC-05] the client''s organisation admin can add funds');
select is((select recorded_by_name from budget_fund_entries where bucket_id = pg_temp.bid(9) order by seq desc limit 1), 'Priya Nair', '[F0-12][AC-15] and is recorded as the admin');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is((select count(*) > 0 from budget_buckets where client_id = 'b1111111-1111-1111-1111-111111111111'), true, '[F0-12][AC-05] an assigned carer can read Margaret''s buckets');
select is((select count(*) > 0 from budget_bucket_summary('b1111111-1111-1111-1111-111111111111')), true, '[F0-12][AC-05] and her summary');
select throws_ok(format($$ select add_funds(%L, 10) $$, pg_temp.bid(9)), '42501', null, '[F0-12][AC-05] a carer cannot add funds');
select throws_ok(format($$ select remove_funds(%L, 10) $$, pg_temp.bid(9)), '42501', null, '[F0-12][AC-05] a carer cannot remove funds');
select throws_ok($$ select add_bucket('b1111111-1111-1111-1111-111111111111', 'Carer bucket', 0) $$, '42501', null, '[F0-12][AC-05] a carer cannot add a bucket');
select throws_ok(format($$ select rename_bucket(%L, 'Renamed') $$, pg_temp.bid(9)), '42501', null, '[F0-12][AC-05] a carer cannot rename a bucket');
select throws_ok(format($$ select remove_bucket(%L) $$, pg_temp.bid(9)), '42501', null, '[F0-12][AC-05] a carer cannot remove a bucket');


-- A carer on an active shift creates an event with a cost (PD-058: whoever creates it sets it, carers included)
select lives_ok($$ insert into care_events (id, client_id, title, starts_at, completion_mode, cost, bucket_id, created_by)
  values ('e5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', 'Carer added', '2026-12-01 10:00:00+11', 'manual', 12.50, 'c0000000-0000-0000-0000-000000000009', 'a3333333-3333-3333-3333-333333333333') $$,
  '[F0-12][AC-05] a carer on shift can create an event with a cost and a bucket');
select lives_ok($$ select set_occurrence_done('e5555555-5555-5555-5555-555555555555', '2026-12-01 10:00:00+11') $$, '[F0-12][AC-05] and complete it');
select is((select status || ':' || amount || ':' || recorded_by_name from budget_costs where event_id = 'e5555555-5555-5555-5555-555555555555'), 'paid:12.50:Aisha Rahman',
  '[F0-12][AC-05] the cost is charged to the bucket the carer chose');
select throws_ok($$ insert into care_events (client_id, title, starts_at, completion_mode, cost, bucket_id, created_by)
  values ('b1111111-1111-1111-1111-111111111111', 'Wrong client bucket', '2026-12-02 10:00:00+11', 'manual', 5, 'c0000000-0000-0000-0000-000000000016', 'a3333333-3333-3333-3333-333333333333') $$,
  '22023', null, '[F0-12][AC-05] a carer cannot charge another client''s bucket');

-- AC-17: only the creating carer, the family or an admin can change an event's cost (human, 2026-09-27)
select lives_ok($$ update care_events set cost = 20 where id = 'e5555555-5555-5555-5555-555555555555' $$, '[F0-12][AC-17] the carer who created an event can change its cost');
select is((select cost from care_events where id = 'e5555555-5555-5555-5555-555555555555'), 20.00::numeric, '[F0-12][AC-17] and it changed');
select throws_ok($$ update care_events set cost = 20, bucket_id = 'c0000000-0000-0000-0000-000000000009' where id = 'e1111111-1111-1111-1111-111111111111' $$, '42501', null, '[F0-12][AC-17] a carer on shift cannot change the cost of an event someone else created');
select throws_ok($$ select set_event_cost('e1111111-1111-1111-1111-111111111111', 20, 'c0000000-0000-0000-0000-000000000009') $$, '42501', null, '[F0-12][AC-17] nor through set_event_cost');
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select lives_ok($$ select set_event_cost('e5555555-5555-5555-5555-555555555555', 30, 'c0000000-0000-0000-0000-000000000009') $$, '[F0-12][AC-17] an admin of the client''s organisation can change it');
select is((select cost from care_events where id = 'e5555555-5555-5555-5555-555555555555'), 30.00::numeric, '[F0-12][AC-17] and it changed');
select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select throws_ok($$ select set_event_cost('e5555555-5555-5555-5555-555555555555', 1, 'c0000000-0000-0000-0000-000000000009') $$, '42501', null, '[F0-12][AC-17] another organisation''s admin cannot');
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok($$ update care_events set cost = 35 where id = 'e5555555-5555-5555-5555-555555555555' $$, '[F0-12][AC-17] the family can change it directly');
select lives_ok($$ select set_event_cost('e5555555-5555-5555-5555-555555555555', null, null) $$, '[F0-12][AC-17] or clear it');
select is((select cost::text || bucket_id::text from care_events where id = 'e5555555-5555-5555-5555-555555555555'), null, '[F0-12][AC-17] a cleared event has neither cost nor bucket');
select throws_ok($$ select set_event_cost('e5555555-5555-5555-5555-555555555555', 5, null) $$, '22023', null, '[F0-12][AC-17] a cost needs a bucket, and a bucket a cost');

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is((select count(*) from budget_buckets), 0::bigint, '[F0-12][AC-05] a carer not assigned to Margaret sees no buckets');
select is((select count(*) from budget_fund_entries), 0::bigint, '[F0-12][AC-05] no fund entries');
select is((select count(*) from budget_costs), 0::bigint, '[F0-12][AC-05] no costs');
select is((select count(*) from budget_bucket_summary('b1111111-1111-1111-1111-111111111111')), 0::bigint, '[F0-12][AC-05] and no summary rows');

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select is((select count(*) from budget_buckets where client_id = 'b1111111-1111-1111-1111-111111111111'), 0::bigint, '[F0-12][AC-05] another client''s family sees none of Margaret''s buckets');
select is((select count(*) from budget_buckets where client_id = 'b2222222-2222-2222-2222-222222222222'), 1::bigint, '[F0-12][AC-05] but sees their own');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is((select count(*) from budget_buckets where client_id = 'b2222222-2222-2222-2222-222222222222'), 0::bigint, '[F0-12][AC-05] Helen sees none of Robert''s buckets');

select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select is((select count(*) from budget_buckets where client_id = 'b1111111-1111-1111-1111-111111111111'), 0::bigint, '[F0-12][AC-05] another organisation''s admin sees none of Margaret''s buckets');
select throws_ok(format($$ select add_funds(%L, 10) $$, pg_temp.bid(9)), '42501', null, '[F0-12][AC-05] and cannot add funds to them');

-- ---------------------------------------------------------------------------
-- AC-14: RLS, direct writes, append-only, audit
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok($$ insert into budget_buckets (client_id, name) values ('b1111111-1111-1111-1111-111111111111', 'Direct') $$, '42501', null, '[F0-12][AC-14] a user cannot insert a bucket directly');
select throws_ok($$ insert into budget_fund_entries (bucket_id, client_id, kind, amount, recorded_by, recorded_by_name) values ('c0000000-0000-0000-0000-000000000009', 'b1111111-1111-1111-1111-111111111111', 'funds_added', 1, 'a1111111-1111-1111-1111-111111111111', 'x') $$, '42501', null, '[F0-12][AC-14] nor a fund entry');
select throws_ok($$ insert into budget_costs (bucket_id, client_id, description, amount, status, original_start, incurred_on, recorded_by, recorded_by_name) values ('c0000000-0000-0000-0000-000000000009', 'b1111111-1111-1111-1111-111111111111', 'x', 1, 'pending', now(), current_date, 'a1111111-1111-1111-1111-111111111111', 'x') $$, '42501', null, '[F0-12][AC-14] nor a cost');
select throws_ok($$ update budget_buckets set name = 'Direct' where id = 'c0000000-0000-0000-0000-000000000009' $$, '42501', null, '[F0-12][AC-14] nor rename a bucket');

reset role;
select is((select relrowsecurity from pg_class where oid = 'budget_buckets'::regclass), true, '[F0-12][AC-14] budget_buckets has RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'budget_fund_entries'::regclass), true, '[F0-12][AC-14] budget_fund_entries has RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'budget_costs'::regclass), true, '[F0-12][AC-14] budget_costs has RLS enabled');
select throws_ok($$ update budget_fund_entries set note = 'edited' $$, '42501', null, '[F0-12][AC-14] a fund entry cannot be updated, even by the owner');
select throws_ok($$ delete from budget_fund_entries $$, '42501', null, '[F0-12][AC-14] nor deleted');
select throws_ok($$ truncate budget_fund_entries $$, '42501', null, '[F0-12][AC-14] nor truncated');
select throws_ok($$ delete from budget_costs $$, '42501', null, '[F0-12][AC-14] a cost cannot be deleted');
select throws_ok($$ update budget_costs set amount = 1 where bucket_id = 'c0000000-0000-0000-0000-000000000015' $$, '42501', null, '[F0-12][AC-14] a cost''s amount cannot change');
select throws_ok($$ update budget_costs set status = 'pending' where bucket_id = 'c0000000-0000-0000-0000-000000000001' $$, '42501', null, '[F0-12][AC-14] a paid cost cannot go back to pending');
select lives_ok($$ update budget_costs set status = 'paid', paid_on = current_date where bucket_id = 'c0000000-0000-0000-0000-000000000015' $$, '[F0-12][AC-14] a pending cost can become paid');
select cmp_ok((select count(*) from audit_log where table_name = 'budget_buckets'), '>', 0::bigint, '[F0-12][AC-14] budget_buckets changes are audited');
select cmp_ok((select count(*) from audit_log where table_name = 'budget_fund_entries'), '>', 0::bigint, '[F0-12][AC-14] budget_fund_entries changes are audited');
select cmp_ok((select count(*) from audit_log where table_name = 'budget_costs'), '>', 0::bigint, '[F0-12][AC-14] budget_costs changes are audited');

-- ---------------------------------------------------------------------------
-- AC-12: an event never takes its costs with it
-- ---------------------------------------------------------------------------
update care_events set is_active = false where id = 'e1111111-1111-1111-1111-111111111111';
select is((select count(*) from budget_costs where event_id = 'e1111111-1111-1111-1111-111111111111'), 4::bigint, '[F0-12][AC-12] deactivating an event leaves its four costs');
select is((select confdeltype::text from pg_constraint where conrelid = 'budget_costs'::regclass and confrelid = 'care_events'::regclass), 'n', '[F0-12][AC-12] a cost''s event link is ON DELETE SET NULL');

select * from finish();
rollback;
