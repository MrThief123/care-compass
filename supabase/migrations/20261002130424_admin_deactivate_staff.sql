-- ADM-03: an admin deactivates a carer of their own organisation.
--
-- `profiles.is_active` already gates every access path (current_profile, is_family_of,
-- is_assigned_carer, sign-in and the route guard), so deactivating is setting it false. Access is
-- derived from shifts (PD-041), so the carer's future shifts (every client) are cancelled and the
-- one in progress ends now, the same treatment `admin_end_carer_assignment` gives one client.
-- Nothing is deleted: the profile stays, and completions snapshot the actor name with no FK to
-- profiles, so history is untouched. Idempotent: an already-inactive carer returns unchanged.

create or replace function admin_deactivate_staff(p_profile_id uuid)
returns profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_profile profiles;
begin
  if auth.uid() is null or not session_is_aal2() then
    raise exception 'only an admin of the carer''s organisation can deactivate staff'
      using errcode = '42501';
  end if;

  v_org := admin_current_org_id();

  if p_profile_id is null then
    raise exception 'a carer is required' using errcode = '22023';
  end if;

  select * into v_profile
  from profiles
  where id = p_profile_id
    and role = 'carer'
    and organisation_id = v_org;
  if not found then
    raise exception 'that carer is not in this organisation' using errcode = '42501';
  end if;

  update profiles set is_active = false where id = p_profile_id returning * into v_profile;

  update shifts
  set cancelled_at = now()
  where carer_id = p_profile_id
    and cancelled_at is null
    and starts_at >= now();

  update shifts
  set ends_at = now()
  where carer_id = p_profile_id
    and cancelled_at is null
    and starts_at < now()
    and ends_at > now();

  return v_profile;
end;
$$;

revoke all on function admin_deactivate_staff(uuid) from public, anon, authenticated;
grant execute on function admin_deactivate_staff(uuid) to authenticated;

-- The Staff list shows deactivated carers in an Inactive section (FD-03), but
-- `profiles_select_same_org` only matches active rows, so an admin could never read them again.
-- This narrow policy lets an active admin at AAL2 read *inactive carers of their own
-- organisation*, nothing else: other roles, other organisations and active rows are covered (or
-- not) by the existing policies exactly as before. The helper is SECURITY DEFINER so the policy
-- does not recurse into profiles' own RLS.
create or replace function is_admin_of_organisation(p_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_organisation_id is not null
     and session_is_aal2()
     and exists (
       select 1
       from profiles p
       where p.id = auth.uid()
         and p.role = 'admin'
         and p.is_active
         and p.organisation_id = p_organisation_id
     );
$$;

create policy profiles_select_inactive_carers_for_admin on profiles
  for select
  using (
    role = 'carer'
    and not is_active
    and is_admin_of_organisation(organisation_id)
  );
