-- [INT-01] Automatic budget threshold emails — database level.
-- Covers the table's shape and RLS (service-role only), the unique constraint that makes a
-- send idempotent, and budget_thresholds_snapshot() returning the same percent_used /
-- threshold_state math as F0-12's budget_bucket_summary(), across every client at once. The
-- job's own behaviour (recipients, email sending, AC-01 to AC-05) is covered by
-- tests/integration/budget-thresholds.test.ts.
begin;
select plan(16);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com');

insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true);

insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells');

insert into client_family_members (client_id, profile_id) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111');

insert into budget_buckets (id, client_id, name) values
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Government');

-- $1,000 in, $900 paid this period (current month, so period_used = used): 90% — alert (PD-032).
insert into budget_fund_entries (bucket_id, client_id, kind, amount, recorded_by, recorded_by_name) values
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'bucket_added', 1000, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');
insert into budget_costs (bucket_id, client_id, original_start, description, amount, status, incurred_on, paid_on, recorded_by, recorded_by_name) values
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', now(), 'Physio', 900, 'paid', budget_today(), budget_today(), 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------
select has_table('public', 'budget_threshold_notifications', '[INT-01] the table exists');
select columns_are(
  'public', 'budget_threshold_notifications',
  array['id', 'bucket_id', 'threshold', 'period_start', 'sent_at'],
  '[INT-01] exactly the columns the data model specifies'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.budget_threshold_notifications'::regclass),
  true,
  '[INT-01] RLS is enabled'
);

-- ---------------------------------------------------------------------------
-- RLS: no policies and no grants — deny-all for anon/authenticated, service-role only (the
-- job). With no SELECT/INSERT grant at all, a signed-in user's query is refused outright
-- (42501) rather than silently filtered to zero rows by RLS (there's no grant for RLS to
-- filter in the first place) — the loud failure this table is meant to have (PRD Security).
-- ---------------------------------------------------------------------------
insert into budget_threshold_notifications (bucket_id, threshold, period_start)
values ('c1111111-1111-1111-1111-111111111111', 85, date_trunc('month', budget_today())::date);

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  'select count(*) from budget_threshold_notifications',
  '42501',
  null,
  '[INT-01] a signed-in family member cannot even query the table (no grant, not just RLS)'
);
select throws_ok(
  format(
    'insert into budget_threshold_notifications (bucket_id, threshold, period_start) values (%L, 75, %L)',
    'c1111111-1111-1111-1111-111111111111', date_trunc('month', budget_today())::date
  ),
  '42501',
  null,
  '[INT-01] a signed-in family member cannot insert a notification row'
);
reset role;

-- ---------------------------------------------------------------------------
-- Idempotency: the unique constraint that makes "at most once per threshold per period" hold
-- even if the job's own already-sent check were ever bypassed or raced.
-- ---------------------------------------------------------------------------
select throws_ok(
  format(
    'insert into budget_threshold_notifications (bucket_id, threshold, period_start) values (%L, 85, %L)',
    'c1111111-1111-1111-1111-111111111111', date_trunc('month', budget_today())::date
  ),
  '23505',
  null,
  '[INT-01][AC-02] the same bucket/threshold/period cannot be recorded twice'
);
select lives_ok(
  format(
    'insert into budget_threshold_notifications (bucket_id, threshold, period_start) values (%L, 100, %L)',
    'c1111111-1111-1111-1111-111111111111', date_trunc('month', budget_today())::date
  ),
  '[INT-01] a different threshold for the same bucket/period is a separate row'
);
select throws_ok(
  format(
    'insert into budget_threshold_notifications (bucket_id, threshold, period_start) values (%L, 50, %L)',
    'c1111111-1111-1111-1111-111111111111', date_trunc('month', budget_today())::date
  ),
  '23514',
  null,
  '[INT-01] a threshold outside 75/85/100 (PD-032) is rejected'
);

-- ---------------------------------------------------------------------------
-- budget_thresholds_snapshot(): system-wide, matching budget_bucket_summary()'s math.
-- ---------------------------------------------------------------------------
-- One row per live bucket system-wide, compared against budget_buckets rather than a literal,
-- so the test holds on a database that already has seed or other test data (FD-03).
select is(
  (select count(*)::int from budget_thresholds_snapshot()),
  (select count(*)::int from budget_buckets where removed_at is null),
  '[INT-01] one row for every bucket that exists (system-wide, not one client''s)'
);
select is(
  (select percent_used from budget_thresholds_snapshot() where bucket_id = 'c1111111-1111-1111-1111-111111111111'),
  90::numeric,
  '[INT-01] $900 of $1,000 this period reads 90%'
);
select is(
  (select threshold_state from budget_thresholds_snapshot() where bucket_id = 'c1111111-1111-1111-1111-111111111111'),
  'alert',
  '[INT-01][AC-01] 90% is the alert state (PD-032: 85 alert)'
);
select is(
  (select organisation_id from budget_thresholds_snapshot() where bucket_id = 'c1111111-1111-1111-1111-111111111111'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  '[INT-01] carries the client''s current organisation_id (AC-03 reads this live, not a snapshot copy)'
);
select is(
  (select client_name from budget_thresholds_snapshot() where bucket_id = 'c1111111-1111-1111-1111-111111111111'),
  'Margaret Wells',
  '[INT-01] carries the client''s name for the email template'
);
select is(
  (select period_start from budget_thresholds_snapshot() where bucket_id = 'c1111111-1111-1111-1111-111111111111'),
  date_trunc('month', budget_today())::date,
  '[INT-01] period_start is the current calendar month (FD-02, F0-12), same as budget_bucket_summary'
);

-- Only the job's service-role client may call it — never anon/authenticated.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  'select * from budget_thresholds_snapshot()',
  '42501',
  null,
  '[INT-01] a signed-in user cannot call budget_thresholds_snapshot() (revoked from authenticated)'
);
reset role;
set role anon;
select throws_ok(
  'select * from budget_thresholds_snapshot()',
  '42501',
  null,
  '[INT-01] anon cannot call it either'
);
reset role;

select * from finish();
rollback;
