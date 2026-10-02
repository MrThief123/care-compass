-- ADM-09 FD-02: an admin edits, extends or cancels a shift, but only one that has not ended.
-- Admin lane migration for its own rule (precedent: ADM-03 FD-06/FD-08); no other table changes.
--
-- USING: only a live (not cancelled, not ended) shift can be updated, so ended and cancelled shifts
-- are frozen and a cancellation can't be cleared. WITH CHECK: the edited row must still end in the
-- future, so a shift can't be moved into the past (cancel it instead).
-- transfer_client_organisation and admin_deactivate_staff are SECURITY DEFINER and bypass RLS.
drop policy shifts_update_admin on shifts;
create policy shifts_update_admin on shifts
  for update to authenticated
  using (is_admin_of_client(client_id) and cancelled_at is null and ends_at > now())
  with check (is_admin_of_client(client_id) and ends_at > now());

-- A shift can't be moved to another client, or reassigned to a deactivated carer. Fires only when
-- the carer or client changes, so the deactivate and transfer functions (which only set
-- cancelled_at / ends_at) are unaffected. The other-organisation check stays with
-- shifts_before_update_assignment (F0-21).
create or replace function shifts_before_update_edit_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.client_id is distinct from old.client_id then
    raise exception 'a shift cannot be moved to another client' using errcode = '42501';
  end if;
  if new.carer_id is distinct from old.carer_id
     and not exists (select 1 from profiles p where p.id = new.carer_id and p.role = 'carer' and p.is_active) then
    raise exception 'a shift cannot be given to a deactivated carer' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function shifts_before_update_edit_guard() from public, anon, authenticated;

create trigger shifts_before_update_edit_guard_trg
  before update of carer_id, client_id on shifts
  for each row
  when (old.carer_id is distinct from new.carer_id or old.client_id is distinct from new.client_id)
  execute function shifts_before_update_edit_guard();
