-- F0-08: Append-only audit log capture
-- Records every create, update and delete with actor and before/after row images.
-- History must survive staff and organisation changes and must not be editable by
-- anyone, including admins (NFR-7, ADR-01, ADR-03).

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
-- actor_id has no foreign key on purpose: audit rows must outlive the profile
-- (and auth user) that made the change.
create table audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_role text not null,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  before jsonb,
  after jsonb,
  client_id uuid
);

comment on column audit_log.record_id is
  'Primary key of the changed row when the table has an id column; null for composite-key tables (the keys are in before/after).';
comment on column audit_log.client_id is
  'Client the change belongs to, when the table is client-scoped; null otherwise.';

create index audit_log_client_id_occurred_at_idx on audit_log (client_id, occurred_at);
create index audit_log_table_record_idx on audit_log (table_name, record_id);

-- RLS on with no policies: no role can read or write through PostgREST. There is
-- no SELECT policy by default (the viewer is parked, PL-06); INSERT happens only
-- through the SECURITY DEFINER trigger below.
alter table audit_log enable row level security;

revoke all on audit_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Append-only guard: rejects UPDATE, DELETE and TRUNCATE for every role,
-- including the table owner and the service role (which bypass grants and RLS).
-- ---------------------------------------------------------------------------
create or replace function audit_log_reject_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'audit_log is append-only: % is not permitted', tg_op
    using errcode = '42501';
end;
$$;

create trigger audit_log_no_update_delete
  before update or delete on audit_log
  for each row execute function audit_log_reject_change();

create trigger audit_log_no_truncate
  before truncate on audit_log
  for each statement execute function audit_log_reject_change();

-- ---------------------------------------------------------------------------
-- audit_row_change(): generic AFTER INSERT/UPDATE/DELETE row trigger.
-- SECURITY DEFINER so it can write audit_log and read the actor's profile
-- whatever the caller's grants and RLS.
--
-- Attach to a table with one statement:
--   create trigger audit_<table>
--     after insert or update or delete on <table>
--     for each row execute function audit_row_change();
-- ---------------------------------------------------------------------------
create or replace function audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_after jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_after, v_before);
begin
  -- No session user (service-role job, migration, SQL console) -> 'system'.
  if v_actor_id is null then
    v_actor_role := 'system';
  else
    select p.role::text into v_actor_role from profiles p where p.id = v_actor_id;
    v_actor_role := coalesce(v_actor_role, 'unknown');
  end if;

  insert into audit_log (actor_id, actor_role, table_name, record_id, action, before, after, client_id)
  values (
    v_actor_id,
    v_actor_role,
    tg_table_name,
    (v_row ->> 'id')::uuid,
    tg_op,
    v_before,
    v_after,
    case when tg_table_name = 'clients' then (v_row ->> 'id')::uuid else (v_row ->> 'client_id')::uuid end
  );

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Attach to the existing tables (F0-06 tenancy, F0-10 shifts)
-- ---------------------------------------------------------------------------
create trigger audit_organisations
  after insert or update or delete on organisations
  for each row execute function audit_row_change();

create trigger audit_profiles
  after insert or update or delete on profiles
  for each row execute function audit_row_change();

create trigger audit_clients
  after insert or update or delete on clients
  for each row execute function audit_row_change();

create trigger audit_client_family_members
  after insert or update or delete on client_family_members
  for each row execute function audit_row_change();

create trigger audit_carer_client_assignments
  after insert or update or delete on carer_client_assignments
  for each row execute function audit_row_change();

create trigger audit_client_info_sections
  after insert or update or delete on client_info_sections
  for each row execute function audit_row_change();

create trigger audit_shifts
  after insert or update or delete on shifts
  for each row execute function audit_row_change();
