-- F0-10: Shifts schema, active-shift function and conflict query
-- Non-recurring shifts assigning a carer to a client for a time window;
-- basis for shift-based edit rights, admin overlap warnings and 'who is on
-- today' visibility. Overlaps are never blocked (D30); shifts never recur (D31).

-- ---------------------------------------------------------------------------
-- shifts
-- ---------------------------------------------------------------------------
create table shifts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id),
  client_id uuid not null references clients (id) on delete cascade,
  carer_id uuid not null references profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint shifts_ends_after_starts check (ends_at > starts_at)
);

alter table shifts enable row level security;

create index shifts_carer_id_idx on shifts (carer_id);
create index shifts_client_id_idx on shifts (client_id);
create index shifts_organisation_id_idx on shifts (organisation_id);

-- Validate the carer belongs to the client's current organisation at insert,
-- and derive organisation_id from the client rather than trusting the caller.
create or replace function shifts_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_org uuid;
  v_carer_org uuid;
begin
  select organisation_id into v_client_org from clients where id = new.client_id;
  select organisation_id into v_carer_org from profiles where id = new.carer_id and role = 'carer';

  if v_carer_org is null or v_carer_org is distinct from v_client_org then
    raise exception 'carer must belong to the same organisation as the client';
  end if;

  new.organisation_id := v_client_org;
  return new;
end;
$$;

create trigger shifts_before_insert_trg
before insert on shifts
for each row execute function shifts_before_insert();

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Is the calling carer on an active (non-cancelled, in-progress) shift for this client, now?
-- Half-open interval: [starts_at, ends_at) — now() == ends_at is not active.
create or replace function carer_on_active_shift(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from shifts s
    where s.client_id = p_client_id
      and s.carer_id = auth.uid()
      and s.cancelled_at is null
      and s.starts_at <= now()
      and now() < s.ends_at
  );
$$;

-- Shifts for this carer whose window overlaps [p_starts_at, p_ends_at). Used
-- for a soft admin warning only — overlaps are never blocked (D30).
create or replace function overlapping_shifts(p_carer_id uuid, p_starts_at timestamptz, p_ends_at timestamptz)
returns setof shifts
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from shifts s
  where s.carer_id = p_carer_id
    and s.cancelled_at is null
    and s.starts_at < p_ends_at
    and s.ends_at > p_starts_at;
$$;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

-- carer: read own shifts
create policy shifts_select_carer on shifts
  for select
  using (carer_id = auth.uid());

-- family: read shifts for linked clients
create policy shifts_select_family on shifts
  for select
  using (is_family_of(client_id));

-- admin: read/insert/update (incl. cancel via update) shifts for their organisation's clients
create policy shifts_select_admin on shifts
  for select
  using (is_admin_of_client(client_id));

create policy shifts_insert_admin on shifts
  for insert
  with check (is_admin_of_client(client_id));

create policy shifts_update_admin on shifts
  for update
  using (is_admin_of_client(client_id))
  with check (is_admin_of_client(client_id));
