-- [ADM-02] Admin — Staff list and add/edit staff (PD-038, PD-039, PD-040/PD-057)
--
-- A carer account is invited, not self-registered (PD-040, PD-057): the account (auth.users row)
-- is created by the isolated service-role module (src/server/jobs/**, ADR-02), never here, since a
-- SECURITY DEFINER function cannot create an auth.users row itself. This migration is the RLS-backed
-- write path either side of that call:
--   * admin_create_staff_profile: the admin's session inserts the new carer's profile, once the
--     jobs module has created the auth user. SECURITY DEFINER because an admin has no INSERT right
--     on profiles, and must not get one generally (only through this narrow, validated path).
--   * admin_discard_staff_invite: compensating clean-up if the profile insert fails (a name/email
--     validation error, say) after the auth user already exists — mirrors
--     discard_unregistered_account() (20260927010000_sign_up.sql) for the same reason: the
--     service-role client that created the user is out of reach here.
--   * admin_update_staff: edits an existing carer's own profile fields. No auth user involved, so
--     this is the whole write, one call.
--
-- Every function: caller must be a signed-in, active admin (auth.uid()), and every organisation_id
-- comes from the caller's own profile, never a parameter — an admin can only ever touch their own
-- organisation's carers (Security/Permissions, ADM-02 PRD). Errors: 42501 not permitted (not
-- signed in, not an admin, or the target profile is not this admin's own organisation's carer),
-- 22023 a required field is blank or email is not a plausible email.

create or replace function admin_current_org_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org
  from profiles
  where id = auth.uid() and is_active and role = 'admin';
  if v_org is null then
    raise exception 'not permitted: an active admin is required' using errcode = '42501';
  end if;
  return v_org;
end;
$$;

revoke all on function admin_current_org_id() from public, anon, authenticated;

-- A name is required; phone and job title are optional free text (job titles are a fixed list in
-- the UI today, ADM-02 DECISIONS.md FD-01 — this column stores whatever string it is given). A
-- plausible email shape only: real deliverability is the invite email itself failing or bouncing.
create or replace function admin_check_staff_fields(p_first_name text, p_last_name text, p_email text)
returns void
language plpgsql
immutable
as $$
begin
  if nullif(btrim(p_first_name), '') is null or nullif(btrim(p_last_name), '') is null then
    raise exception 'first and last name are required' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_email, '')), '') is null or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'a valid email is required' using errcode = '22023';
  end if;
end;
$$;

create or replace function admin_create_staff_profile(
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_job_title text
)
returns profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := admin_current_org_id();
  v_row profiles;
begin
  perform admin_check_staff_fields(p_first_name, p_last_name, p_email);
  if p_user_id is null then
    raise exception 'a user id is required' using errcode = '22023';
  end if;
  if exists (select 1 from profiles where id = p_user_id) then
    raise exception 'that account already has a profile' using errcode = '23505';
  end if;

  insert into profiles (id, role, organisation_id, first_name, last_name, phone, email, job_title)
  values (
    p_user_id, 'carer', v_org,
    btrim(p_first_name), btrim(p_last_name),
    nullif(btrim(coalesce(p_phone, '')), ''), btrim(p_email), nullif(btrim(coalesce(p_job_title, '')), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function admin_create_staff_profile(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function admin_create_staff_profile(uuid, text, text, text, text, text) to authenticated;

-- Only ever the caller's own half-made invite (no profile yet); never a working account.
create or replace function admin_discard_staff_invite(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform admin_current_org_id();
  delete from auth.users u
  where u.id = p_user_id
    and not exists (select 1 from profiles p where p.id = u.id);
end;
$$;

revoke all on function admin_discard_staff_invite(uuid) from public, anon, authenticated;
grant execute on function admin_discard_staff_invite(uuid) to authenticated;

create or replace function admin_update_staff(
  p_profile_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_job_title text
)
returns profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := admin_current_org_id();
  v_row profiles;
begin
  perform admin_check_staff_fields(p_first_name, p_last_name, p_email);

  update profiles
  set first_name = btrim(p_first_name),
      last_name = btrim(p_last_name),
      phone = nullif(btrim(coalesce(p_phone, '')), ''),
      email = btrim(p_email),
      job_title = nullif(btrim(coalesce(p_job_title, '')), '')
  where id = p_profile_id and organisation_id = v_org and role = 'carer'
  returning * into v_row;

  if not found then
    raise exception 'not permitted to edit this profile' using errcode = '42501';
  end if;

  return v_row;
end;
$$;

revoke all on function admin_update_staff(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function admin_update_staff(uuid, text, text, text, text, text) to authenticated;
