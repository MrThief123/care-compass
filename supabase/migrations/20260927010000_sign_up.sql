-- [F0-17] Self-serve sign-up for Family and Organisation accounts (PD-057, CHG-010)
--
-- register_account(...): the only write path for a new account's records. The caller has
-- just created an auth user (Supabase Auth sign-up) and is signed in as them; this creates,
-- in one transaction:
--   * family:       profiles (role family, no organisation), clients (organisation_id
--                   null) and client_family_members, linking the two;
--   * admin:        organisations (the name given) and profiles (role admin,
--                   organisation_id = the new organisation).
-- Everything is created for the calling user only (auth.uid()), and only once.
--
-- Public sign-up can never create a carer, join an existing organisation, or link to an
-- existing client. That is enforced here rather than in the form:
--   * p_role other than family/admin is rejected (42501), before anything is read;
--   * there is no organisation-id or client-id parameter, so a request cannot name an
--     existing one; the new rows are always fresh;
--   * the caller must not already have a profile (23505), so an existing account cannot
--     be re-registered into a different role or organisation.
-- The contact email on the profile is copied from the caller's own auth account (PD-054),
-- never taken from the request.
--
-- SECURITY DEFINER because authenticated users have no INSERT right on profiles,
-- organisations, clients or client_family_members, and must not get one. Errors:
--   42501 not permitted (signed out, or a role that cannot self-register),
--   23505 this user already has a profile,
--   22023 a required name is blank.
--
-- discard_unregistered_account(): compensating clean-up. If registration fails after the
-- auth user was created, the action calls this to remove the half-made auth user, so the
-- person can try again with the same email. It only ever deletes the caller's own auth
-- user, and only while they have no profile, so it cannot remove a working account. It
-- exists because the service-role client is limited to src/server/jobs/** (ADR-02).

create or replace function register_account(
  p_role app_role,
  p_first_name text,
  p_last_name text,
  p_client_first_name text default null,
  p_client_last_name text default null,
  p_organisation_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_first_name text := nullif(btrim(p_first_name), '');
  v_last_name text := nullif(btrim(p_last_name), '');
  v_client_first_name text := nullif(btrim(p_client_first_name), '');
  v_client_last_name text := nullif(btrim(p_client_last_name), '');
  v_organisation_name text := nullif(btrim(p_organisation_name), '');
  v_client_id uuid;
  v_organisation_id uuid;
begin
  if v_uid is null then
    raise exception 'you must be signed in to create an account' using errcode = '42501';
  end if;

  if p_role is null or p_role not in ('family', 'admin') then
    raise exception 'only family and organisation accounts can be created here'
      using errcode = '42501';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if not found then
    raise exception 'no account exists for this session' using errcode = '42501';
  end if;

  if exists (select 1 from profiles where id = v_uid) then
    raise exception 'this account is already registered' using errcode = '23505';
  end if;

  if v_first_name is null or v_last_name is null then
    raise exception 'first and last name are required' using errcode = '22023';
  end if;

  if p_role = 'family' then
    if v_client_first_name is null or v_client_last_name is null then
      raise exception 'the first and last name of the person being cared for are required'
        using errcode = '22023';
    end if;

    insert into profiles (id, role, organisation_id, first_name, last_name, email)
    values (v_uid, 'family', null, v_first_name, v_last_name, v_email);

    insert into clients (organisation_id, first_name, last_name)
    values (null, v_client_first_name, v_client_last_name)
    returning id into v_client_id;

    insert into client_family_members (client_id, profile_id)
    values (v_client_id, v_uid);
  else
    if v_organisation_name is null then
      raise exception 'an organisation name is required' using errcode = '22023';
    end if;

    insert into organisations (name)
    values (v_organisation_name)
    returning id into v_organisation_id;

    insert into profiles (id, role, organisation_id, first_name, last_name, email)
    values (v_uid, 'admin', v_organisation_id, v_first_name, v_last_name, v_email);
  end if;

  return jsonb_build_object(
    'role', p_role,
    'profile_id', v_uid,
    'client_id', v_client_id,
    'organisation_id', v_organisation_id
  );
end;
$$;

revoke all on function register_account(app_role, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function register_account(app_role, text, text, text, text, text)
  to authenticated;

create or replace function discard_unregistered_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'you must be signed in' using errcode = '42501';
  end if;

  delete from auth.users u
  where u.id = auth.uid()
    and not exists (select 1 from profiles p where p.id = u.id);
end;
$$;

revoke all on function discard_unregistered_account() from public, anon, authenticated;
grant execute on function discard_unregistered_account() to authenticated;
