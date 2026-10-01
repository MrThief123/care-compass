-- [INT-01] Automatic budget threshold emails (OQ-01, OQ-03, OQ-17, OQ-28)
--
-- budget_threshold_notifications: records that a threshold email has been sent for a bucket
-- this period, so the job (src/server/jobs/budget-thresholds.ts) never sends the same
-- (bucket, threshold, period) combination twice. A row is inserted only after the email
-- provider confirms the send, so a provider failure leaves nothing recorded and the next run
-- retries it (PRD Error/Edge Cases). `on conflict do nothing` on that insert additionally
-- makes two overlapping job runs harmless, though the job is not expected to overlap itself.
create table budget_threshold_notifications (
  id uuid primary key default gen_random_uuid(),
  bucket_id uuid not null references budget_buckets (id) on delete cascade,
  -- PD-032's three states, kept in sync with budget_threshold_state() below.
  threshold smallint not null check (threshold in (75, 85, 100)),
  period_start date not null,
  sent_at timestamptz not null default now(),
  unique (bucket_id, threshold, period_start)
);

-- RLS on with no policies (deny-all for anon/authenticated): this is an internal operational
-- table, read and written only by the job's service-role client (ADR-02), which bypasses RLS.
-- No family member, carer or admin ever needs to query it directly.
alter table budget_threshold_notifications enable row level security;
revoke all on budget_threshold_notifications from anon, authenticated;

create index budget_threshold_notifications_bucket_idx
  on budget_threshold_notifications (bucket_id, period_start);

-- budget_thresholds_snapshot(): the same percent_used / threshold_state math as
-- budget_bucket_summary() (F0-12, supabase/migrations/20260927000000_budget.sql), across every
-- bucket system-wide rather than one client's — budget_bucket_summary is SECURITY INVOKER and
-- RLS-scoped to the caller's own clients, which the job (no signed-in user, auth.uid() is null)
-- cannot use. Kept deliberately parallel to budget_bucket_summary so a change to PD-032's
-- thresholds (budget_threshold_state, unchanged here) or to what counts as "this period"
-- applies identically to the screens and the emails; the two still read budget_today() and
-- budget_threshold_state() from the same place.
create or replace function budget_thresholds_snapshot()
returns table (
  bucket_id uuid,
  client_id uuid,
  client_name text,
  organisation_id uuid,
  percent_used numeric,
  threshold_state text,
  period_start date
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id,
         cl.id,
         btrim(coalesce(cl.first_name, '') || ' ' || coalesce(cl.last_name, '')),
         cl.organisation_id,
         pct.percent_used,
         budget_threshold_state(pct.percent_used, c.pending_count, f.total > 0 and f.total - c.used <= 0),
         p.period_start
  from budget_buckets b
  join clients cl on cl.id = b.client_id
  cross join lateral (
    select date_trunc('month', budget_today())::date as period_start
  ) p
  cross join lateral (
    select coalesce(sum(e.amount), 0) as total from budget_fund_entries e where e.bucket_id = b.id
  ) f
  cross join lateral (
    select coalesce(sum(k.amount) filter (where k.status = 'paid'), 0) as used,
           coalesce(sum(k.amount) filter (where k.status = 'paid' and k.paid_on >= p.period_start), 0) as period_used,
           count(*) filter (where k.status = 'pending') as pending_count
    from budget_costs k where k.bucket_id = b.id
  ) c
  cross join lateral (
    select case when f.total - (c.used - c.period_used) > 0
                then round(c.period_used * 100 / (f.total - (c.used - c.period_used)))
           end as percent_used
  ) pct
  where b.removed_at is null;
$$;

-- Reveals every client's spending across the whole system: never for anon/authenticated, only
-- the job's service-role client (which bypasses grants, the same as F0-13's documents functions).
revoke all on function budget_thresholds_snapshot() from public, anon, authenticated;
