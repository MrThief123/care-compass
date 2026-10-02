-- ADM-08: an admin ends one carer's assignment to one client.
--
-- There is no assignment table (PD-041): a carer reads a client while they have a non-cancelled
-- shift with that client that has not ended (`is_assigned_carer`). Ending the assignment is
-- therefore ending those shifts, the same treatment `transfer_client_organisation` gives a
-- client's shifts: future shifts are cancelled, the one in progress ends now. Nothing is deleted;
-- finished and already-cancelled shifts, completions and every other carer-client pair are
-- untouched. Returns the number of shifts changed (0 when the assignment is already ended).

create or replace function admin_end_carer_assignment(p_carer_id uuid, p_client_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cancelled integer;
  v_ended integer;
begin
  if auth.uid() is null or not session_is_aal2() then
    raise exception 'only an admin of the client''s organisation can end an assignment'
      using errcode = '42501';
  end if;

  if p_carer_id is null or p_client_id is null then
    raise exception 'a carer and a client are required' using errcode = '22023';
  end if;

  if not is_admin_of_client(p_client_id) then
    raise exception 'only an admin of the client''s organisation can end an assignment'
      using errcode = '42501';
  end if;

  -- The carer must belong to the same organisation as the client (and so as the admin).
  if not exists (
    select 1
    from profiles p
    join clients c on c.organisation_id = p.organisation_id
    where p.id = p_carer_id
      and p.role = 'carer'
      and c.id = p_client_id
  ) then
    raise exception 'that carer is not in this organisation' using errcode = '42501';
  end if;

  update shifts
  set cancelled_at = now()
  where client_id = p_client_id
    and carer_id = p_carer_id
    and cancelled_at is null
    and starts_at >= now();
  get diagnostics v_cancelled = row_count;

  update shifts
  set ends_at = now()
  where client_id = p_client_id
    and carer_id = p_carer_id
    and cancelled_at is null
    and starts_at < now()
    and ends_at > now();
  get diagnostics v_ended = row_count;

  return v_cancelled + v_ended;
end;
$$;

revoke all on function admin_end_carer_assignment(uuid, uuid) from public, anon, authenticated;
grant execute on function admin_end_carer_assignment(uuid, uuid) to authenticated;
