-- [FAM-13] Family — Change organisation
--
-- transfer_client_organisation(p_client_id, p_new_org_id): moves a client to another
-- organisation in one transaction. The client's routines, events, budget, documents,
-- family links and history stay exactly as they are; only the organisation changes,
-- and what belonged to the outgoing organisation's staff ends:
--   * clients.organisation_id becomes the new organisation, so the outgoing admin and
--     carers lose access on their next request (every policy reads it live);
--   * active carer assignments are ended (ended_at = now(); a future-dated one ends at
--     its own start, so it never becomes active);
--   * shifts that have not started are cancelled (cancelled_at = now());
--   * a shift in progress is ended at now(), not cancelled (PRD: PROPOSED);
--   * finished and already-cancelled shifts, and ended assignments, are left alone, and
--     keep the organisation that made them.
-- The change is audited by the audit_row_change triggers on clients, shifts and
-- carer_client_assignments (F0-08), with the caller as the actor.
--
-- SECURITY DEFINER because families have no UPDATE policy on clients, shifts or
-- assignments, and must not get one. Authority is checked inside: only a family member
-- linked to the client (OQ-16, is_family_of). Admins and carers, including those of the
-- client's own organisation, are refused. Errors: 42501 not permitted, 22023 bad input
-- (no organisation, or already with it), P0002 unknown organisation.
--
-- Any table added later that carries its own organisation_id must be reviewed here.

create or replace function transfer_client_organisation(p_client_id uuid, p_new_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_org uuid;
begin
  if auth.uid() is null or p_client_id is null or not is_family_of(p_client_id) then
    raise exception 'only a family member of the client can change the organisation'
      using errcode = '42501';
  end if;

  if p_new_org_id is null then
    raise exception 'an organisation is required' using errcode = '22023';
  end if;

  -- Lock the client, so two changes at once cannot interleave.
  select organisation_id into v_current_org
  from clients
  where id = p_client_id
  for update;

  if not exists (select 1 from organisations where id = p_new_org_id) then
    raise exception 'that organisation does not exist' using errcode = 'P0002';
  end if;

  if v_current_org is not distinct from p_new_org_id then
    raise exception 'the client already belongs to that organisation' using errcode = '22023';
  end if;

  update clients
  set organisation_id = p_new_org_id,
      updated_at = now()
  where id = p_client_id;

  update carer_client_assignments
  set ended_at = greatest(now(), started_at)
  where client_id = p_client_id
    and (ended_at is null or ended_at > now());

  update shifts
  set cancelled_at = now()
  where client_id = p_client_id
    and cancelled_at is null
    and starts_at >= now();

  update shifts
  set ends_at = now()
  where client_id = p_client_id
    and cancelled_at is null
    and starts_at < now()
    and ends_at > now();
end;
$$;

revoke all on function transfer_client_organisation(uuid, uuid) from public, anon, authenticated;
grant execute on function transfer_client_organisation(uuid, uuid) to authenticated;

-- The picker's list: every organisation registered with Care Compass, by name, with the
-- client's current one flagged. Only id and name leave the database. Organisations are
-- otherwise readable by their own members only, so this is a function, not a policy:
-- and it answers only for the client's family.
create or replace function list_organisations_for_transfer(p_client_id uuid)
returns table (id uuid, name text, is_current boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_client_id is null or not is_family_of(p_client_id) then
    raise exception 'only a family member of the client can list organisations'
      using errcode = '42501';
  end if;

  return query
    select o.id, o.name, o.id is not distinct from c.organisation_id
    from organisations o
    cross join (select cl.organisation_id from clients cl where cl.id = p_client_id) c
    order by o.name, o.id;
end;
$$;

revoke all on function list_organisations_for_transfer(uuid) from public, anon, authenticated;
grant execute on function list_organisations_for_transfer(uuid) to authenticated;
