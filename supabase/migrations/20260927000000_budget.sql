-- F0-12: Budget buckets, fund entries, event costs and the summary
--
-- A client's money. Buckets are open (PD-059): free-named, unique per client, an optional kind.
-- Funds go in and out through an append-only ledger. A completed occurrence of an event that has a
-- cost is charged to the event's bucket, once: paid if the bucket can cover it in full, otherwise
-- held whole as pending and paid automatically, oldest first, when funds are added (PD-058, PD-060).
-- Money never overdraws, so remaining is never negative.
--
-- Rules carried here (docs/development/shared/shared-budget-schema/):
--   * REQ-N12 / ADR-01: money is numeric(12,2); every multi-row write is one atomic function.
--   * PD-032: threshold states at 75 / 85 / 100 percent, in budget_threshold_state() only.
--   * PD-034 / PD-058: the client's family and their organisation's admins change the budget; an
--     assigned carer reads; a carer never changes it by hand. The actor is always auth.uid().
--   * FD-02: a cost never depends on its event living (event_id is ON DELETE SET NULL), and a pending
--     cost carries over until paid. No accounting period is modelled.
--   * Fund entries are append-only; a cost can only move from pending to paid. Nobody can update,
--     delete or truncate a ledger row, not even the table owner (as audit_log, F0-08).
--
-- Every table has RLS in this migration and an F0-08 audit trigger.

-- ---------------------------------------------------------------------------
-- budget_buckets
-- ---------------------------------------------------------------------------
create table budget_buckets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete restrict,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 40),
  -- A suggestion the design draws; most buckets have none (PD-059).
  kind text check (kind in ('ndis', 'fixed', 'government')),
  -- Removal is soft so History still resolves; the ledger records the money that left.
  removed_at timestamptz,
  created_by uuid default auth.uid() references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table budget_buckets enable row level security;

create unique index budget_buckets_client_name_idx on budget_buckets (client_id, lower(name)) where removed_at is null;

-- ---------------------------------------------------------------------------
-- budget_fund_entries: append-only ledger of money in and out
-- ---------------------------------------------------------------------------
-- recorded_by carries no foreign key on purpose and recorded_by_name is a snapshot: a record of money
-- must outlive the profile that made it (REQ-N6, as audit_log and care_event_completions).
create table budget_fund_entries (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  bucket_id uuid not null references budget_buckets (id) on delete restrict,
  client_id uuid not null references clients (id) on delete restrict,
  kind text not null check (kind in ('funds_added', 'funds_removed', 'bucket_added', 'bucket_removed')),
  -- Signed: net funds are the sum of the amounts.
  amount numeric(12, 2) not null,
  description text not null default '',
  note text,
  recorded_by uuid not null,
  recorded_by_name text not null,
  entry_date date not null default (now() at time zone 'Australia/Melbourne')::date,
  created_at timestamptz not null default now(),
  constraint budget_fund_entries_sign check (
    (kind = 'funds_added' and amount > 0)
    or (kind = 'funds_removed' and amount < 0)
    or (kind = 'bucket_added' and amount >= 0)
    or (kind = 'bucket_removed' and amount <= 0)
  )
);

alter table budget_fund_entries enable row level security;

create index budget_fund_entries_bucket_idx on budget_fund_entries (bucket_id, seq);
create index budget_fund_entries_client_idx on budget_fund_entries (client_id, entry_date);

-- ---------------------------------------------------------------------------
-- budget_costs: one row per completed occurrence of a costed event
-- ---------------------------------------------------------------------------
create table budget_costs (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  bucket_id uuid not null references budget_buckets (id) on delete restrict,
  client_id uuid not null references clients (id) on delete restrict,
  -- FD-02: removing an event can never remove its costs.
  event_id uuid references care_events (id) on delete set null,
  original_start timestamptz not null,
  -- The event's title when the cost was charged.
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  status text not null check (status in ('paid', 'pending')),
  incurred_on date not null,
  paid_on date,
  note text,
  recorded_by uuid not null,
  recorded_by_name text not null,
  created_at timestamptz not null default now(),
  constraint budget_costs_paid_on check ((status = 'paid') = (paid_on is not null)),
  -- An occurrence is charged once, whatever is done and undone.
  constraint budget_costs_one_per_occurrence unique (event_id, original_start)
);

alter table budget_costs enable row level security;

create index budget_costs_bucket_idx on budget_costs (bucket_id, status, incurred_on, seq);
create index budget_costs_client_idx on budget_costs (client_id, incurred_on);

-- ---------------------------------------------------------------------------
-- An event's cost and the bucket it is paid from (CHG-020)
-- ---------------------------------------------------------------------------
alter table care_events
  add column cost numeric(12, 2) check (cost is null or cost > 0),
  add column bucket_id uuid references budget_buckets (id) on delete restrict,
  add constraint care_events_cost_and_bucket check ((cost is null) = (bucket_id is null));

-- The bucket must be the event's client's, and still there. A change applies to future completions
-- only: a cost is read when an occurrence is completed.
create or replace function care_events_check_bucket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.bucket_id is not null
     and not exists (
       select 1 from budget_buckets b
       where b.id = new.bucket_id and b.client_id = new.client_id and b.removed_at is null
     ) then
    raise exception 'that bucket does not belong to this client' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger care_events_check_bucket_trg
  before insert or update of bucket_id, client_id on care_events
  for each row execute function care_events_check_bucket();

-- ---------------------------------------------------------------------------
-- Ledger protection
-- ---------------------------------------------------------------------------
create or replace function budget_reject_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception '% is append-only: % is not permitted', tg_table_name, tg_op
    using errcode = '42501';
end;
$$;

create trigger budget_fund_entries_no_update_delete
  before update or delete on budget_fund_entries
  for each row execute function budget_reject_change();
create trigger budget_fund_entries_no_truncate
  before truncate on budget_fund_entries
  for each statement execute function budget_reject_change();
create trigger budget_costs_no_delete
  before delete on budget_costs
  for each row execute function budget_reject_change();
create trigger budget_costs_no_truncate
  before truncate on budget_costs
  for each statement execute function budget_reject_change();

-- A cost changes only from pending to paid (status and paid_on), or loses its event link when the
-- event goes (ON DELETE SET NULL).
create or replace function budget_costs_guard_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (to_jsonb(new) - 'status' - 'paid_on' - 'event_id') is distinct from (to_jsonb(old) - 'status' - 'paid_on' - 'event_id')
     or (new.event_id is distinct from old.event_id and new.event_id is not null)
     or (new.status is distinct from old.status and not (old.status = 'pending' and new.status = 'paid'))
     or (new.status = old.status and new.paid_on is distinct from old.paid_on) then
    raise exception 'budget_costs: only a pending cost becoming paid is permitted' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger budget_costs_guard_update_trg
  before update on budget_costs
  for each row execute function budget_costs_guard_update();

-- ---------------------------------------------------------------------------
-- Access helpers (SECURITY DEFINER, stable, fixed search_path, like F0-06 / F0-11)
-- ---------------------------------------------------------------------------

-- Who may read a client's budget: their family, an assigned carer, the organisation's admin.
create or replace function can_read_budget(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_family_of(p_client_id)
      or is_assigned_carer(p_client_id)
      or is_admin_of_client(p_client_id);
$$;

-- Who may change it (PD-034, PD-058): the family, and the client's organisation's admins. Never a carer.
create or replace function can_edit_budget(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_family_of(p_client_id)
      or is_admin_of_client(p_client_id);
$$;

-- ---------------------------------------------------------------------------
-- RLS and grants: select only; every write is one of the functions below
-- ---------------------------------------------------------------------------
create policy budget_buckets_select on budget_buckets
  for select using (can_read_budget(client_id));
create policy budget_fund_entries_select on budget_fund_entries
  for select using (can_read_budget(client_id));
create policy budget_costs_select on budget_costs
  for select using (can_read_budget(client_id));

revoke all on budget_buckets, budget_fund_entries, budget_costs from anon, authenticated;
grant select on budget_buckets, budget_fund_entries, budget_costs to authenticated;

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable by clients)
-- ---------------------------------------------------------------------------
create or replace function budget_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Australia/Melbourne')::date;
$$;

-- PD-032: the one place the thresholds live. 100, any pending cost, or funds all gone is depleted;
-- 85 alert; 75 warning.
create or replace function budget_threshold_state(p_percent numeric, p_pending_count bigint, p_exhausted boolean default false)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_pending_count, 0) > 0 or coalesce(p_exhausted, false) then 'depleted'
    when p_percent is null then 'normal'
    when p_percent >= 100 then 'depleted'
    when p_percent >= 85 then 'alert'
    when p_percent >= 75 then 'warning'
    else 'normal'
  end;
$$;

-- Amounts are decimals with at most 2 places and fit numeric(12,2): more than 0, or 0 or more for a
-- starting amount. Never trusted from the client.
create or replace function budget_check_amount(p_amount numeric, p_allow_zero boolean default false)
returns void
language plpgsql
immutable
as $$
begin
  if p_amount is null
     or p_amount < 0
     or (p_amount = 0 and not p_allow_zero)
     or p_amount <> round(p_amount, 2)
     or p_amount >= 10000000000 then
    raise exception 'enter an amount %, with at most 2 decimal places',
      case when p_allow_zero then 'of $0 or more' else 'more than $0' end
      using errcode = '22023';
  end if;
end;
$$;

-- Funds in less paid costs. Pending costs are not taken off (PD-058).
create or replace function budget_bucket_balance(p_bucket_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select sum(amount) from budget_fund_entries where bucket_id = p_bucket_id), 0)
       - coalesce((select sum(amount) from budget_costs where bucket_id = p_bucket_id and status = 'paid'), 0);
$$;

-- Pays a bucket's pending costs whole, oldest first, stopping at the first the balance cannot cover.
create or replace function budget_settle_pending(p_bucket_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost budget_costs;
begin
  loop
    select * into v_cost
    from budget_costs
    where bucket_id = p_bucket_id and status = 'pending'
    order by incurred_on, seq
    limit 1
    for update;

    exit when not found or v_cost.amount > budget_bucket_balance(p_bucket_id);

    update budget_costs set status = 'paid', paid_on = budget_today() where id = v_cost.id;
  end loop;
end;
$$;

-- The signed-in user's name as a snapshot for a record.
create or replace function budget_actor_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '')
     from profiles p where p.id = auth.uid()),
    'Unknown');
$$;

-- Locks a bucket for a change by its client's family or admin. 42501 when the caller may not (and when
-- the bucket does not exist: nothing about it is revealed), 22023 when it has been removed.
create or replace function budget_bucket_for_write(p_bucket_id uuid)
returns budget_buckets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket budget_buckets;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select * into v_bucket from budget_buckets where id = p_bucket_id for update;
  if not found or not can_edit_budget(v_bucket.client_id) then
    raise exception 'not permitted to change this budget' using errcode = '42501';
  end if;
  if v_bucket.removed_at is not null then
    raise exception 'that bucket has been removed' using errcode = '22023';
  end if;
  return v_bucket;
end;
$$;

-- A bucket name is trimmed and 1 to 40 characters.
create or replace function budget_clean_name(p_name text)
returns text
language plpgsql
immutable
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
begin
  if char_length(v_name) not between 1 and 40 then
    raise exception 'a bucket name is required, at most 40 characters' using errcode = '22023';
  end if;
  return v_name;
end;
$$;

revoke all on function budget_bucket_balance(uuid), budget_settle_pending(uuid), budget_actor_name(),
  budget_bucket_for_write(uuid), budget_check_amount(numeric, boolean), budget_clean_name(text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Changing the budget
-- ---------------------------------------------------------------------------

-- add_bucket(client, name, starting_amount, kind, note): a new bucket with its starting amount ($0 allowed),
-- recorded as "bucket_added". Errors: 42501 not permitted, 22023 bad name or amount, 23505 name taken,
-- 23514 unknown kind.
create or replace function add_bucket(
  p_client_id uuid,
  p_name text,
  p_starting_amount numeric,
  p_kind text default null,
  p_note text default null
)
returns budget_buckets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_bucket budget_buckets;
begin
  if auth.uid() is null or p_client_id is null or not can_edit_budget(p_client_id) then
    raise exception 'not permitted to change this budget' using errcode = '42501';
  end if;
  v_name := budget_clean_name(p_name);
  perform budget_check_amount(p_starting_amount, true);

  insert into budget_buckets (client_id, name, kind)
  values (p_client_id, v_name, p_kind)
  returning * into v_bucket;

  insert into budget_fund_entries (bucket_id, client_id, kind, amount, description, note, recorded_by, recorded_by_name)
  values (v_bucket.id, p_client_id, 'bucket_added', p_starting_amount, coalesce(v_note, 'Bucket added'), v_note, auth.uid(), budget_actor_name());

  return v_bucket;
end;
$$;

-- rename_bucket(bucket, name): entries stay attached by id; a rename records no row (PD-059).
create or replace function rename_bucket(p_bucket_id uuid, p_name text)
returns budget_buckets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket budget_buckets;
  v_name text;
begin
  v_bucket := budget_bucket_for_write(p_bucket_id);
  v_name := budget_clean_name(p_name);

  update budget_buckets set name = v_name, updated_at = now() where id = v_bucket.id
  returning * into v_bucket;
  return v_bucket;
end;
$$;

-- add_funds(bucket, amount, note): adds money, then pays the bucket's pending costs whole, oldest first.
create or replace function add_funds(p_bucket_id uuid, p_amount numeric, p_note text default null)
returns budget_fund_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket budget_buckets;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_row budget_fund_entries;
begin
  v_bucket := budget_bucket_for_write(p_bucket_id);
  perform budget_check_amount(p_amount);

  insert into budget_fund_entries (bucket_id, client_id, kind, amount, description, note, recorded_by, recorded_by_name)
  values (v_bucket.id, v_bucket.client_id, 'funds_added', p_amount, coalesce(v_note, 'Funds added'), v_note, auth.uid(), budget_actor_name())
  returning * into v_row;

  perform budget_settle_pending(v_bucket.id);
  return v_row;
end;
$$;

-- remove_funds(bucket, amount, note): takes money out, never below $0 (PD-058). 22023 "Only $X available".
create or replace function remove_funds(p_bucket_id uuid, p_amount numeric, p_note text default null)
returns budget_fund_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket budget_buckets;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_balance numeric;
  v_row budget_fund_entries;
begin
  v_bucket := budget_bucket_for_write(p_bucket_id);
  perform budget_check_amount(p_amount);

  v_balance := budget_bucket_balance(v_bucket.id);
  if p_amount > v_balance then
    raise exception 'Only $% available', to_char(v_balance, 'FM999,999,999,990.00') using errcode = '22023';
  end if;

  insert into budget_fund_entries (bucket_id, client_id, kind, amount, description, note, recorded_by, recorded_by_name)
  values (v_bucket.id, v_bucket.client_id, 'funds_removed', -p_amount, coalesce(v_note, 'Funds removed'), v_note, auth.uid(), budget_actor_name())
  returning * into v_row;

  return v_row;
end;
$$;

-- remove_bucket(bucket, note): only when no cost, paid or pending, was ever charged to it. The money left
-- leaves with it and is recorded as "bucket_removed". Events that pointed at it keep their cost and move to
-- the client's "Miscellaneous" bucket, created with a $0 start when there is none (FD-03, human 2026-09-27).
create or replace function remove_bucket(p_bucket_id uuid, p_note text default null)
returns budget_buckets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket budget_buckets;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_misc budget_buckets;
begin
  v_bucket := budget_bucket_for_write(p_bucket_id);

  if exists (select 1 from budget_costs where bucket_id = v_bucket.id) then
    raise exception 'a bucket with costs charged to it cannot be removed' using errcode = '22023';
  end if;

  insert into budget_fund_entries (bucket_id, client_id, kind, amount, description, note, recorded_by, recorded_by_name)
  values (v_bucket.id, v_bucket.client_id, 'bucket_removed', -budget_bucket_balance(v_bucket.id), coalesce(v_note, 'Bucket removed'), v_note, auth.uid(), budget_actor_name());

  update budget_buckets set removed_at = now(), updated_at = now() where id = v_bucket.id
  returning * into v_bucket;

  -- Future completions of those events must still cost something, so they move rather than lose their cost.
  -- The removal comes first so removing "Miscellaneous" itself makes a fresh one.
  if exists (select 1 from care_events where bucket_id = v_bucket.id) then
    select * into v_misc
    from budget_buckets
    where client_id = v_bucket.client_id and lower(name) = 'miscellaneous' and removed_at is null;

    if not found then
      insert into budget_buckets (client_id, name) values (v_bucket.client_id, 'Miscellaneous')
      returning * into v_misc;
      insert into budget_fund_entries (bucket_id, client_id, kind, amount, description, note, recorded_by, recorded_by_name)
      values (v_misc.id, v_misc.client_id, 'bucket_added', 0, 'Bucket added',
              'Created when the "' || v_bucket.name || '" bucket was removed', auth.uid(), budget_actor_name());
    end if;

    update care_events set bucket_id = v_misc.id where bucket_id = v_bucket.id;
  end if;

  return v_bucket;
end;
$$;

revoke all on function add_bucket(uuid, text, numeric, text, text), rename_bucket(uuid, text),
  add_funds(uuid, numeric, text), remove_funds(uuid, numeric, text), remove_bucket(uuid, text)
  from public, anon, authenticated;
grant execute on function add_bucket(uuid, text, numeric, text, text), rename_bucket(uuid, text),
  add_funds(uuid, numeric, text), remove_funds(uuid, numeric, text), remove_bucket(uuid, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Charging a completed occurrence (PD-058)
-- ---------------------------------------------------------------------------
-- After a 'done' row is written, the event's cost is charged once: paid if nothing older is pending and
-- the bucket can cover it in full, otherwise held whole as pending. The occurrence has already completed;
-- money never stops care being recorded. A cost changed since is read as it stands now (future only).
create or replace function care_event_completions_charge_cost()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event care_events;
  v_bucket budget_buckets;
  v_paid boolean;
begin
  if new.action <> 'done' then
    return null;
  end if;

  select * into v_event from care_events where id = new.event_id;
  if v_event.cost is null or v_event.bucket_id is null then
    return null;
  end if;

  select * into v_bucket from budget_buckets where id = v_event.bucket_id for update;
  if not found or v_bucket.removed_at is not null then
    return null;
  end if;

  v_paid := not exists (select 1 from budget_costs where bucket_id = v_bucket.id and status = 'pending')
        and v_event.cost <= budget_bucket_balance(v_bucket.id);

  insert into budget_costs
    (bucket_id, client_id, event_id, original_start, description, amount, status, incurred_on, paid_on, recorded_by, recorded_by_name)
  values (
    v_bucket.id, v_event.client_id, v_event.id, new.original_start, v_event.title, v_event.cost,
    case when v_paid then 'paid' else 'pending' end,
    budget_today(),
    case when v_paid then budget_today() end,
    new.actor_id, new.actor_display_name
  )
  on conflict (event_id, original_start) do nothing;

  return null;
end;
$$;

create trigger care_event_completions_charge_cost_trg
  after insert on care_event_completions
  for each row execute function care_event_completions_charge_cost();

-- ---------------------------------------------------------------------------
-- The summary
-- ---------------------------------------------------------------------------
-- One row per current bucket. SECURITY INVOKER, so RLS decides who sees rows: a user not linked to
-- the client gets none.
--
-- FD-02 (human, 2026-09-27): a period is a calendar month in Australia/Melbourne, and the balance carries
-- over. total, used and remaining are cumulative, so unspent money never lapses at month end. percent_used
-- and the thresholds measure this month's paid costs (period_used) against the funds available at the
-- month's start plus anything added since: total less what was paid before this month. It is null when
-- nothing was available. A bucket whose funds are all gone is depleted. The month is a default that can
-- change (billing periods are a commercial choice); it is defined only here.
create or replace function budget_bucket_summary(p_client_id uuid)
returns table (
  bucket_id uuid,
  name text,
  kind text,
  total numeric,
  used numeric,
  remaining numeric,
  percent_used numeric,
  threshold_state text,
  pending_total numeric,
  pending_count bigint,
  period_start date,
  period_end date,
  period_used numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select b.id,
         b.name,
         b.kind,
         f.total,
         c.used,
         f.total - c.used,
         pct.percent_used,
         budget_threshold_state(pct.percent_used, c.pending_count, f.total > 0 and f.total - c.used <= 0),
         c.pending_total,
         c.pending_count,
         p.period_start,
         p.period_end,
         c.period_used
  from budget_buckets b
  cross join lateral (
    select date_trunc('month', budget_today())::date as period_start,
           (date_trunc('month', budget_today()) + interval '1 month - 1 day')::date as period_end
  ) p
  cross join lateral (
    select coalesce(sum(e.amount), 0) as total from budget_fund_entries e where e.bucket_id = b.id
  ) f
  cross join lateral (
    select coalesce(sum(k.amount) filter (where k.status = 'paid'), 0) as used,
           coalesce(sum(k.amount) filter (where k.status = 'paid' and k.paid_on >= p.period_start), 0) as period_used,
           coalesce(sum(k.amount) filter (where k.status = 'pending'), 0) as pending_total,
           count(*) filter (where k.status = 'pending') as pending_count
    from budget_costs k where k.bucket_id = b.id
  ) c
  cross join lateral (
    select case when f.total - (c.used - c.period_used) > 0
                then round(c.period_used * 100 / (f.total - (c.used - c.period_used)))
           end as percent_used
  ) pct
  where b.client_id = p_client_id and b.removed_at is null
  order by b.created_at, b.name;
$$;

revoke all on function budget_bucket_summary(uuid) from public, anon, authenticated;
grant execute on function budget_bucket_summary(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Who may change an event's cost (human, 2026-09-27)
-- ---------------------------------------------------------------------------
-- Only the carer who created the event (still on an active shift, as any carer edit, OQ-09), the client's
-- family, or an admin of the client's organisation. F0-11's update policy lets any carer on shift edit an
-- event, so cost and bucket_id are guarded here. No session user (a job, a migration) passes.
create or replace function care_events_guard_cost()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or is_family_of(new.client_id)
     or is_admin_of_client(new.client_id)
     or (old.created_by = auth.uid() and can_edit_care_events(new.client_id)) then
    return new;
  end if;
  raise exception 'only the carer who created this event, the family or an admin can change its cost' using errcode = '42501';
end;
$$;

create trigger care_events_guard_cost_trg
  before update of cost, bucket_id on care_events
  for each row
  when (old.cost is distinct from new.cost or old.bucket_id is distinct from new.bucket_id)
  execute function care_events_guard_cost();

-- set_event_cost(event, cost, bucket): sets or clears (null, null) an event's cost and bucket. It exists so an
-- admin, who has no write on care_events (F0-11), can do what family can. Applies to future completions only.
-- Errors: 42501 not permitted, 22023 a cost needs a bucket and a bucket a cost, or a bad amount or bucket.
create or replace function set_event_cost(p_event_id uuid, p_cost numeric, p_bucket_id uuid)
returns care_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event care_events;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if (p_cost is null) <> (p_bucket_id is null) then
    raise exception 'a cost needs a bucket, and a bucket needs a cost' using errcode = '22023';
  end if;
  if p_cost is not null then
    perform budget_check_amount(p_cost);
  end if;

  select * into v_event from care_events where id = p_event_id for update;
  if not found or not can_read_care_events(v_event.client_id) then
    raise exception 'not permitted to change this event' using errcode = '42501';
  end if;

  update care_events set cost = p_cost, bucket_id = p_bucket_id where id = p_event_id
  returning * into v_event;
  return v_event;
end;
$$;

revoke all on function set_event_cost(uuid, numeric, uuid) from public, anon, authenticated;
grant execute on function set_event_cost(uuid, numeric, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Audit (F0-08)
-- ---------------------------------------------------------------------------
create trigger audit_budget_buckets
  after insert or update or delete on budget_buckets
  for each row execute function audit_row_change();

create trigger audit_budget_fund_entries
  after insert or update or delete on budget_fund_entries
  for each row execute function audit_row_change();

create trigger audit_budget_costs
  after insert or update or delete on budget_costs
  for each row execute function audit_row_change();
