-- [INT-09] Overdue care alert emails (REQ-33, PD-062)
--
-- care_overdue_alert_notifications: one row per task occurrence already alerted, so the job
-- (src/server/jobs/care-overdue-alerts.ts) never emails the same occurrence twice. An occurrence
-- is identified the way the app identifies it (event id plus its original start, before any
-- override), so moving it does not make it a new one. A row is written only after every
-- recipient's send succeeded, so a provider failure leaves nothing recorded and the next run
-- retries. The primary key makes overlapping runs harmless.
-- Kept apart from care_events and care_event_completions on purpose: completions are append-only
-- and other features read all three (CLAUDE.md section 3).
create table care_overdue_alert_notifications (
  event_id uuid not null references care_events (id) on delete cascade,
  original_start timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (event_id, original_start)
);

-- RLS on with no policies and no grants: internal operational table, read and written only by
-- the job's service-role client, same as budget_threshold_notifications and
-- budget_pending_cost_notifications.
alter table care_overdue_alert_notifications enable row level security;
revoke all on care_overdue_alert_notifications from anon, authenticated;
