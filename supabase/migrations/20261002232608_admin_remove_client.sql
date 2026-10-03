-- ADM-05: an admin removes a client from their organisation.
--
-- Remove is a detach, never a delete (OQ-06 / PD-036): the client row, its events, completions,
-- budget, documents and family links stay with the family. The organisation's access ends because
-- every policy reads `clients.organisation_id` live, and carer access is derived from shifts
-- (PD-041), so the client's future shifts are cancelled and the one in progress ends now, the same
-- treatment `transfer_client_organisation` gives a client's shifts (FD-02).
--
-- `clients.organisation_removed_at` marks a removal. A family sign-up also creates a client with
-- no organisation, so a null organisation alone does not mean "removed"; the Family banner reads
-- this marker (FD-03). A trigger clears it whenever the client is given an organisation again, so
-- `transfer_client_organisation` (FAM-13) needs no change.

alter table clients add column organisation_removed_at timestamptz;

create or replace function clients_clear_organisation_removed()
returns trigger
language plpgsql
as $$
begin
  if new.organisation_id is not null then
    new.organisation_removed_at := null;
  end if;
  return new;
end;
$$;

create trigger clients_clear_organisation_removed
  before update on clients
  for each row
  execute function clients_clear_organisation_removed();

create or replace function admin_remove_client(p_client_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not session_is_aal2() or p_client_id is null
     or not is_admin_of_client(p_client_id) then
    raise exception 'only an admin of the client''s organisation can remove the client'
      using errcode = '42501';
  end if;

  update clients
  set organisation_id = null,
      organisation_removed_at = now(),
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

revoke all on function admin_remove_client(uuid) from public, anon, authenticated;
grant execute on function admin_remove_client(uuid) to authenticated;
