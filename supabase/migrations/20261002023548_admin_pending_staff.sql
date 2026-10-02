-- ADM-08 (FD-07): which of an admin's carers have not yet accepted their invite.
--
-- A carer is invited (ADM-02: `inviteUserByEmail`), so their auth.users row exists with
-- `email_confirmed_at` null until they follow the email link and set a password. An admin cannot
-- read auth.users, so this SECURITY DEFINER function returns only the ids of the caller's own
-- organisation's carers in that state, nothing else from auth.users. Same caller rule as the other
-- admin_* staff functions (admin_current_org_id: a signed-in, active admin, 42501 otherwise).

create or replace function admin_pending_staff_ids()
returns setof uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid := admin_current_org_id();
begin
  return query
  select p.id
  from profiles p
  join auth.users u on u.id = p.id
  where p.organisation_id = v_org
    and p.role = 'carer'
    and u.email_confirmed_at is null;
end;
$$;

revoke all on function admin_pending_staff_ids() from public, anon, authenticated;
grant execute on function admin_pending_staff_ids() to authenticated;
