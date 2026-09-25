-- F0-11: Care events, occurrence overrides and append-only completions
--
-- Storage for what care is due and who did it. Occurrences are never stored: an
-- event holds its recurrence rule, occurrences are expanded on demand by
-- src/lib/recurrence for a requested range (ARCHITECTURE.md §6.2), a per-occurrence
-- exception lives in care_event_overrides, and a completion lives in
-- care_event_completions, both keyed by (event_id, original_start).
--   Occurrence key = `${eventId}:${originalStartISO}`.
--
-- Rules carried here (docs/development/shared/shared-care-events-schema/):
--   * REQ-19 / TM-0409: completions are append-only. Nobody can update, delete or
--     truncate one, not even the table owner or the service role (as audit_log, F0-08).
--   * OQ-10: Overdue is derived, never stored. Done can be undone by adding an
--     'undone' row; the 'done' row stays.
--   * CHG-001 / CHG-009: every event is a task (completion_mode 'manual', ticked off by
--     hand) or a plain event ('automatic', no status, cannot be ticked off). One
--     occurrence can differ from its series through new_completion_mode on an override.
--   * OQ-09: family read/write events of their client; an assigned carer reads; a carer
--     writes only during an active shift for that client; an admin reads. Nobody writes
--     completions except through set_occurrence_done / set_occurrence_undone, and the
--     actor is always auth.uid(), never a parameter.
--   * OQ-16: Family is one role with full authority.
--
-- Every table has RLS in this migration and an F0-08 audit trigger.

-- ---------------------------------------------------------------------------
-- care_events
-- ---------------------------------------------------------------------------
create table care_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  title text not null,
  description text not null default '',
  -- The first (anchor) occurrence.
  starts_at timestamptz not null,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  -- null: a one-off event. Otherwise {"frequency": daily|weekly|monthly|yearly, "interval": n >= 1},
  -- the pair src/lib/recurrence (F0-09) expands; fortnightly is weekly/2, quarterly monthly/3 (PD-046).
  recurrence jsonb,
  recurrence_until date,
  -- 'manual' = task (ticked off by hand); 'automatic' = plain event (no status). CHG-009.
  completion_mode text not null default 'manual' check (completion_mode in ('manual', 'automatic')),
  is_active boolean not null default true,
  -- When it was deactivated (set by the update trigger, cleared on reactivation). A deactivated
  -- event stops generating occurrences from then; earlier ones and their completions stay.
  deactivated_at timestamptz,
  created_by uuid default auth.uid() references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_events_recurrence_shape check (
    recurrence is null
    or (
      jsonb_typeof(recurrence) = 'object'
      and (recurrence ->> 'frequency') in ('daily', 'weekly', 'monthly', 'yearly')
      and case
            when jsonb_typeof(recurrence -> 'interval') = 'number'
              then (recurrence ->> 'interval')::numeric >= 1
               and (recurrence ->> 'interval')::numeric = trunc((recurrence ->> 'interval')::numeric)
            else false
          end
    )
  )
);

alter table care_events enable row level security;

create index care_events_client_id_starts_at_idx on care_events (client_id, starts_at);

-- ---------------------------------------------------------------------------
-- care_event_overrides: one exception per occurrence
-- ---------------------------------------------------------------------------
create table care_event_overrides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references care_events (id) on delete cascade,
  -- Derived from the event on insert, never trusted from the caller.
  client_id uuid not null references clients (id) on delete cascade,
  -- The occurrence's identity: its start before any override.
  original_start timestamptz not null,
  kind text not null check (kind in ('cancelled', 'modified')),
  new_starts_at timestamptz,
  new_duration_minutes integer check (new_duration_minutes is null or new_duration_minutes >= 0),
  -- CHG-009: this one occurrence is a task or a plain event, whatever its series is.
  new_completion_mode text check (new_completion_mode is null or new_completion_mode in ('manual', 'automatic')),
  created_by uuid default auth.uid() references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint care_event_overrides_one_per_occurrence unique (event_id, original_start),
  constraint care_event_overrides_kind_shape check (
    (kind = 'cancelled'
      and new_starts_at is null and new_duration_minutes is null and new_completion_mode is null)
    or (kind = 'modified'
      and (new_starts_at is not null or new_duration_minutes is not null or new_completion_mode is not null))
  )
);

alter table care_event_overrides enable row level security;

create index care_event_overrides_client_id_idx on care_event_overrides (client_id);

-- ---------------------------------------------------------------------------
-- care_event_completions: append-only
-- ---------------------------------------------------------------------------
-- actor_id and organisation_id carry no foreign key on purpose, and actor_display_name
-- is a snapshot: a completion must outlive the profile and organisation that made it
-- (REQ-N6, as audit_log). event_id and client_id do reference their rows and restrict
-- deletion, so an event with history cannot be removed.
create table care_event_completions (
  id uuid primary key default gen_random_uuid(),
  -- Insertion order. now() is constant inside a transaction, so "latest" is by seq.
  seq bigint generated always as identity,
  event_id uuid not null references care_events (id) on delete restrict,
  client_id uuid not null references clients (id) on delete restrict,
  original_start timestamptz not null,
  action text not null check (action in ('done', 'undone')),
  actor_id uuid not null,
  actor_display_name text not null,
  organisation_id uuid,
  occurred_at timestamptz not null default now()
);

alter table care_event_completions enable row level security;

create index care_event_completions_occurrence_idx on care_event_completions (event_id, original_start, seq);
create index care_event_completions_client_id_idx on care_event_completions (client_id, occurred_at);

create or replace function care_event_completions_reject_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'care_event_completions is append-only: % is not permitted', tg_op
    using errcode = '42501';
end;
$$;

create trigger care_event_completions_no_update_delete
  before update or delete on care_event_completions
  for each row execute function care_event_completions_reject_change();

create trigger care_event_completions_no_truncate
  before truncate on care_event_completions
  for each statement execute function care_event_completions_reject_change();

-- ---------------------------------------------------------------------------
-- Triggers that keep the rows honest
-- ---------------------------------------------------------------------------

-- An event never moves to another client; updated_at follows every edit; deactivated_at
-- follows is_active.
create or replace function care_events_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.client_id is distinct from old.client_id then
    raise exception 'an event cannot be moved to another client' using errcode = '22023';
  end if;
  new.updated_at := now();
  if old.is_active and not new.is_active then
    new.deactivated_at := now();
  elsif new.is_active then
    new.deactivated_at := null;
  end if;
  return new;
end;
$$;

create trigger care_events_before_update_trg
  before update on care_events
  for each row execute function care_events_before_update();

-- An override takes its client from its event, and cannot be re-pointed afterwards.
create or replace function care_event_overrides_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    select client_id into new.client_id from care_events where id = new.event_id;
    if new.client_id is null then
      raise exception 'that event does not exist' using errcode = 'P0002';
    end if;
  elsif new.event_id is distinct from old.event_id
     or new.original_start is distinct from old.original_start
     or new.client_id is distinct from old.client_id then
    raise exception 'an override cannot be moved to another occurrence' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger care_event_overrides_before_write_trg
  before insert or update on care_event_overrides
  for each row execute function care_event_overrides_before_write();

-- ---------------------------------------------------------------------------
-- Access helpers (SECURITY DEFINER, stable, fixed search_path, like F0-06 / F0-10)
-- ---------------------------------------------------------------------------

-- Who may read a client's events: their family, an assigned carer, the organisation's admin.
create or replace function can_read_care_events(p_client_id uuid)
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

-- Who may change them (OQ-09): the family at any time; a carer only during an active shift for
-- that client (half-open [start, end), cancelled shifts do not count). An admin never writes.
create or replace function can_edit_care_events(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_family_of(p_client_id)
      or (
        carer_on_active_shift(p_client_id)
        and exists (
          select 1 from profiles p
          where p.id = auth.uid() and p.is_active and p.role = 'carer'
        )
      );
$$;

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------
create policy care_events_select on care_events
  for select using (can_read_care_events(client_id));

create policy care_events_insert on care_events
  for insert with check (created_by = auth.uid() and can_edit_care_events(client_id));

create policy care_events_update on care_events
  for update using (can_edit_care_events(client_id)) with check (can_edit_care_events(client_id));

create policy care_event_overrides_select on care_event_overrides
  for select using (can_read_care_events(client_id));

create policy care_event_overrides_insert on care_event_overrides
  for insert with check (created_by = auth.uid() and can_edit_care_events(client_id));

create policy care_event_overrides_update on care_event_overrides
  for update using (can_edit_care_events(client_id)) with check (can_edit_care_events(client_id));

create policy care_event_completions_select on care_event_completions
  for select using (can_read_care_events(client_id));

-- No delete for anyone (deactivate an event; an override is amended, not removed), and a
-- completion is written by the functions below only.
revoke all on care_events, care_event_overrides, care_event_completions from anon, authenticated;
grant select, insert, update on care_events to authenticated;
grant select, insert, update on care_event_overrides to authenticated;
grant select on care_event_completions to authenticated;

-- ---------------------------------------------------------------------------
-- Who is on shift (OQ-29)
-- ---------------------------------------------------------------------------

-- The carers whose non-cancelled shifts for the client overlap [p_from, p_to), with their full
-- display names (PD-038), for the assignee shown on an occurrence: the carer whose shift covers
-- its start. A function because a family member cannot read carer profiles (their
-- organisation is null). Answers only readers of the client's events; only id, name and the
-- shift window leave the database.
create or replace function client_shift_carers(p_client_id uuid, p_from timestamptz, p_to timestamptz)
returns table (shift_id uuid, carer_id uuid, carer_display_name text, starts_at timestamptz, ends_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_client_id is null or not can_read_care_events(p_client_id) then
    raise exception 'not permitted to see who is on shift for this client' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'a window with a start before its end is required' using errcode = '22023';
  end if;

  return query
    select s.id,
           s.carer_id,
           coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), 'Unknown'),
           s.starts_at,
           s.ends_at
    from shifts s
    join profiles p on p.id = s.carer_id
    where s.client_id = p_client_id
      and s.cancelled_at is null
      and s.starts_at < p_to
      and s.ends_at > p_from
    order by s.starts_at, s.id;
end;
$$;

revoke all on function client_shift_carers(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function client_shift_carers(uuid, timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Ticking off and undoing
-- ---------------------------------------------------------------------------

-- set_occurrence_done(event, original_start): the caller marks one occurrence Done.
-- Authorised for the client's family, or a carer on an active shift for the client
-- (can_edit_care_events, OQ-09). Refused (22023) for a plain event, an occurrence an
-- override made a plain event, a cancelled occurrence, or one before the event's first.
-- Idempotent: an occurrence that is already Done returns its existing completion, so two
-- people ticking at once give one effective Done and the first person stays the actor.
-- Errors: 42501 not permitted, 22023 bad input, P0002 unknown event.
create or replace function set_occurrence_done(p_event_id uuid, p_original_start timestamptz)
returns care_event_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event care_events;
  v_override care_event_overrides;
  v_latest care_event_completions;
  v_profile profiles;
  v_row care_event_completions;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_event_id is null or p_original_start is null then
    raise exception 'an event and an occurrence are required' using errcode = '22023';
  end if;

  select * into v_event from care_events where id = p_event_id;
  if not found then
    raise exception 'that event does not exist' using errcode = 'P0002';
  end if;

  if not can_edit_care_events(v_event.client_id) then
    raise exception 'not permitted to tick off this client''s care' using errcode = '42501';
  end if;

  if p_original_start < v_event.starts_at then
    raise exception 'that occurrence is before the event''s first one' using errcode = '22023';
  end if;

  -- One tick-off per occurrence at a time.
  perform pg_advisory_xact_lock(hashtextextended(p_event_id::text || '|' || p_original_start::text, 0));

  select * into v_override
  from care_event_overrides
  where event_id = p_event_id and original_start = p_original_start;

  if found and v_override.kind = 'cancelled' then
    raise exception 'that occurrence is cancelled' using errcode = '22023';
  end if;

  if coalesce(v_override.new_completion_mode, v_event.completion_mode) <> 'manual' then
    raise exception 'a plain event has no status and cannot be ticked off' using errcode = '22023';
  end if;

  select * into v_latest
  from care_event_completions
  where event_id = p_event_id and original_start = p_original_start
  order by seq desc
  limit 1;

  if found and v_latest.action = 'done' then
    return v_latest;
  end if;

  select * into v_profile from profiles where id = auth.uid();

  insert into care_event_completions
    (event_id, client_id, original_start, action, actor_id, actor_display_name, organisation_id)
  values (
    p_event_id,
    v_event.client_id,
    p_original_start,
    'done',
    auth.uid(),
    coalesce(nullif(trim(coalesce(v_profile.first_name, '') || ' ' || coalesce(v_profile.last_name, '')), ''), 'Unknown'),
    v_profile.organisation_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- set_occurrence_undone(event, original_start): OQ-10. Adds an 'undone' row after a 'done'.
-- The client's family may undo anyone's tick; a carer only their own, and only while still
-- on an active shift. Refused (22023) when the occurrence is not currently Done.
create or replace function set_occurrence_undone(p_event_id uuid, p_original_start timestamptz)
returns care_event_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event care_events;
  v_latest care_event_completions;
  v_profile profiles;
  v_row care_event_completions;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_event_id is null or p_original_start is null then
    raise exception 'an event and an occurrence are required' using errcode = '22023';
  end if;

  select * into v_event from care_events where id = p_event_id;
  if not found then
    raise exception 'that event does not exist' using errcode = 'P0002';
  end if;

  -- Not an editor: refused before anything about the occurrence is revealed.
  if not can_edit_care_events(v_event.client_id) then
    raise exception 'not permitted to change this client''s care' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_event_id::text || '|' || p_original_start::text, 0));

  select * into v_latest
  from care_event_completions
  where event_id = p_event_id and original_start = p_original_start
  order by seq desc
  limit 1;

  if not found or v_latest.action <> 'done' then
    raise exception 'that occurrence is not marked Done' using errcode = '22023';
  end if;

  if not is_family_of(v_event.client_id) and v_latest.actor_id <> auth.uid() then
    raise exception 'only the person who ticked it off, or the family, can undo it' using errcode = '42501';
  end if;

  select * into v_profile from profiles where id = auth.uid();

  insert into care_event_completions
    (event_id, client_id, original_start, action, actor_id, actor_display_name, organisation_id)
  values (
    p_event_id,
    v_event.client_id,
    p_original_start,
    'undone',
    auth.uid(),
    coalesce(nullif(trim(coalesce(v_profile.first_name, '') || ' ' || coalesce(v_profile.last_name, '')), ''), 'Unknown'),
    v_profile.organisation_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function set_occurrence_done(uuid, timestamptz) from public, anon, authenticated;
grant execute on function set_occurrence_done(uuid, timestamptz) to authenticated;
revoke all on function set_occurrence_undone(uuid, timestamptz) from public, anon, authenticated;
grant execute on function set_occurrence_undone(uuid, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Audit (F0-08)
-- ---------------------------------------------------------------------------
create trigger audit_care_events
  after insert or update or delete on care_events
  for each row execute function audit_row_change();

create trigger audit_care_event_overrides
  after insert or update or delete on care_event_overrides
  for each row execute function audit_row_change();

create trigger audit_care_event_completions
  after insert or update or delete on care_event_completions
  for each row execute function audit_row_change();
