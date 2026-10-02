-- [INT-11] Email Family and admins when an event cost goes pending (REQ-37, PL-25)
--
-- budget_pending_cost_notifications: one row per pending cost already emailed, so the job
-- (src/server/jobs/pending-cost-emails.ts) never emails the same cost twice. A row is written
-- only after every recipient's send succeeded, so a provider failure leaves nothing recorded
-- and the next run retries. The primary key on cost_id makes overlapping runs harmless.
-- Kept apart from budget_costs on purpose: its guard trigger rejects any update other than
-- pending to paid, and other features read that table (CLAUDE.md section 3).
create table budget_pending_cost_notifications (
  cost_id uuid primary key references budget_costs (id) on delete cascade,
  sent_at timestamptz not null default now()
);

-- RLS on with no policies and no grants: internal operational table, read and written only by
-- the job's service-role client, same as budget_threshold_notifications.
alter table budget_pending_cost_notifications enable row level security;
revoke all on budget_pending_cost_notifications from anon, authenticated;

-- budget_pending_costs_to_notify(): costs still pending that have no marker, system-wide, with
-- what the email names (bucket, event title as charged, amount) and the client's current
-- organisation (read fresh, so a transferred client never reaches its old admins). Oldest first.
create or replace function budget_pending_costs_to_notify()
returns table (
  cost_id uuid,
  client_id uuid,
  organisation_id uuid,
  amount numeric,
  description text,
  bucket_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select k.id, k.client_id, cl.organisation_id, k.amount, k.description, b.name
  from budget_costs k
  join budget_buckets b on b.id = k.bucket_id
  join clients cl on cl.id = k.client_id
  where k.status = 'pending'
    and not exists (select 1 from budget_pending_cost_notifications n where n.cost_id = k.id)
  order by k.incurred_on, k.seq;
$$;

-- Reveals every client's pending costs: never for anon/authenticated, only the service role.
revoke all on function budget_pending_costs_to_notify() from public, anon, authenticated;
