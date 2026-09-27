-- [F0-18] Carer view access derived from shifts (PD-041, CHG-027)
--
-- Brings read access in line with edit access (`carer_on_active_shift`, F0-10): both are
-- now derived from `shifts` alone. `is_assigned_carer(client_id)` keeps its name and
-- signature (F0-06), so every policy that already calls it — on `clients`, `care_events`,
-- `care_event_overrides`, `client_info_sections`, `documents` and the `client-documents`
-- bucket — changes behaviour without being touched.
--
-- The rule (PRD Scope): the signed-in, active carer has at least one shift with that
-- client that is not cancelled and whose end is after now. Unlike `carer_on_active_shift`,
-- there is no `starts_at <= now()` bound — a shift scheduled for next week already grants
-- read access (PRD Functional Requirements: "access starts when the shift is scheduled").
--
-- `carer_client_assignments` is retired: nothing fills it from shifts (that was the
-- original problem, PD-041), and `transfer_client_organisation` already cancels a client's
-- future shifts and ends the in-progress one on transfer, which now ends read access too —
-- so the `update carer_client_assignments` step it used to take is simply removed, nothing
-- replaces it.

create or replace function is_assigned_carer(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from shifts s
    join profiles p on p.id = s.carer_id
    where s.client_id = p_client_id
      and s.carer_id = auth.uid()
      and p.is_active
      and s.cancelled_at is null
      and s.ends_at > now()
  );
$$;

-- Dropping the table drops its own SELECT policy and its F0-08 audit trigger with it —
-- both are attached to the table, not separate top-level objects.
drop table carer_client_assignments;

-- Same function, minus the `update carer_client_assignments` step (PRD Description: this
-- already cancels future shifts and ends the current one, which is now what ends access).
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
