-- F0-06: Identity, organisation and client access schema with RLS
-- Puts authorisation in the database (ADR-03): role/organisation/assignment tables
-- plus RLS policies so every query is filtered correctly per role.

create type app_role as enum ('family', 'carer', 'admin');

-- ---------------------------------------------------------------------------
-- organisations
-- ---------------------------------------------------------------------------
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abn text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

alter table organisations enable row level security;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null,
  organisation_id uuid references organisations (id),
  first_name text,
  last_name text,
  phone text,
  email text,
  address text,
  job_title text,
  is_active boolean not null default true
);

alter table profiles enable row level security;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations (id),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  suburb text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients enable row level security;

-- ---------------------------------------------------------------------------
-- client_family_members
-- ---------------------------------------------------------------------------
create table client_family_members (
  client_id uuid not null references clients (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  relationship_label text,
  primary key (client_id, profile_id)
);

alter table client_family_members enable row level security;

-- ---------------------------------------------------------------------------
-- carer_client_assignments
-- ---------------------------------------------------------------------------
create table carer_client_assignments (
  id uuid primary key default gen_random_uuid(),
  carer_id uuid not null references profiles (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  organisation_id uuid not null references organisations (id),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table carer_client_assignments enable row level security;

-- ---------------------------------------------------------------------------
-- client_info_sections
-- ---------------------------------------------------------------------------
create table client_info_sections (
  client_id uuid not null references clients (id) on delete cascade,
  key text not null check (key in ('description', 'habits', 'medical_history')),
  body text,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now(),
  primary key (client_id, key)
);

alter table client_info_sections enable row level security;

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER, stable, fixed search_path)
-- ---------------------------------------------------------------------------
create or replace function current_profile()
returns profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from profiles where id = auth.uid() and is_active;
$$;

create or replace function is_family_of(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from client_family_members cfm
    join profiles p on p.id = cfm.profile_id
    where cfm.client_id = p_client_id
      and cfm.profile_id = auth.uid()
      and p.is_active
  );
$$;

create or replace function is_admin_of_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles p
    join clients c on c.organisation_id = p.organisation_id
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active
      and c.id = p_client_id
  );
$$;

create or replace function is_assigned_carer(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from carer_client_assignments a
    join profiles p on p.id = a.carer_id
    where a.client_id = p_client_id
      and a.carer_id = auth.uid()
      and p.is_active
      and a.started_at <= now()
      and (a.ended_at is null or a.ended_at > now())
  );
$$;

-- SECURITY DEFINER lookup so policies on `profiles`/`organisations` never subquery
-- `profiles` under RLS from within their own policy (avoids self-referential recursion).
create or replace function current_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id from profiles where id = auth.uid() and is_active;
$$;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

-- clients: family reads own linked clients; admin reads their org's clients;
-- carer reads clients with an active assignment. Inactive profiles match nothing.
create policy clients_select_family on clients
  for select
  using (is_family_of(id));

create policy clients_select_admin on clients
  for select
  using (is_admin_of_client(id));

create policy clients_select_carer on clients
  for select
  using (is_assigned_carer(id));

-- profiles: a user reads their own profile, and other active profiles within the same organisation
create policy profiles_select_self on profiles
  for select
  using (id = auth.uid());

create policy profiles_select_same_org on profiles
  for select
  using (
    is_active
    and organisation_id is not null
    and organisation_id = current_organisation_id()
  );

-- organisations: readable by active members of that organisation
create policy organisations_select_member on organisations
  for select
  using (id = current_organisation_id());

-- client_family_members: readable by the linked family member and the client's admin
create policy client_family_members_select on client_family_members
  for select
  using (
    profile_id = auth.uid()
    or is_admin_of_client(client_id)
  );

-- carer_client_assignments: readable by the assigned carer and the client's admin
create policy carer_client_assignments_select on carer_client_assignments
  for select
  using (
    carer_id = auth.uid()
    or is_admin_of_client(client_id)
  );

-- client_info_sections: family read/write, assigned carer read, admin none (per OQ-09/PRD scope)
create policy client_info_sections_select on client_info_sections
  for select
  using (
    is_family_of(client_id)
    or is_assigned_carer(client_id)
  );

create policy client_info_sections_write_family on client_info_sections
  for insert
  with check (is_family_of(client_id));

create policy client_info_sections_update_family on client_info_sections
  for update
  using (is_family_of(client_id))
  with check (is_family_of(client_id));
