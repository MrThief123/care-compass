-- [F0-21] Auth security audit: admin authority requires an AAL2 (two-factor) session, and a shift
-- cannot be re-pointed at another organisation's carer.
--
-- HUMAN REVIEW (PRD Scope: "additive migration, shown to the human before it is applied"). Tested on
-- an isolated local stack only. Not applied to any shared or hosted database by this feature.
--
-- 1. AAL2 for admins (AC-01). F0-20 FD-04 found that MFA was enforced only by the app route guard:
--    an admin who signed in with a password but never completed TOTP (session at AAL1) could still
--    read and write every admin-scoped row by calling the data API directly. Every admin grant in
--    the schema flows through three SECURITY DEFINER helpers, so the check is added there, once,
--    instead of to each of the ~40 policies and functions that call them:
--      * is_admin_of_client(client)   -- every admin table policy (clients, shifts,
--        client_family_members, client_info_sections, care events, budget, documents, the
--        client-documents bucket, linked family profiles) and the budget/event functions;
--      * admin_current_org_id()       -- admin_create_staff_profile, admin_discard_staff_invite,
--        admin_update_staff, admin_update_organisation;
--      * current_organisation_id()    -- profiles_select_same_org, organisations_select_member.
--        Carers use this too and are never gated (CHG-040), so it only withholds the organisation
--        from an *admin* below AAL2.
--    The claim read is `auth.jwt() ->> 'aal'` (feature DECISIONS.md FD-01, the PRD's proposed
--    default for a non-blocking question). Only the exact value 'aal2' counts; a missing claim is
--    below AAL2. Family and carer behaviour is unchanged. An admin's own profile stays readable at
--    AAL1 (profiles_select_self, untouched), because the route guard needs the role to send them to
--    /mfa/verify. Service-role jobs (auth.uid() null) are unaffected.
--
--    Signatures are unchanged and nothing is dropped or renamed: every caller keeps working and
--    gains the check. Additive in the CLAUDE.md §3 sense (no column or table change).
--
-- 2. Shift reassignment (AC-03). shifts_before_insert (F0-10) checks that the carer belongs to the
--    client's organisation and derives organisation_id, but only on INSERT. An UPDATE could set
--    carer_id to another organisation's carer (who was then notified about, and could read, this
--    client) or relabel organisation_id. The same rule now runs on UPDATE when carer_id, client_id
--    or organisation_id changes. transfer_client_organisation only changes cancelled_at/ends_at,
--    so it does not fire this trigger.

-- ---------------------------------------------------------------------------
-- The AAL check
-- ---------------------------------------------------------------------------
create or replace function session_is_aal2()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

comment on function session_is_aal2() is
  'F0-21: true only when the caller''s JWT carries aal = aal2 (TOTP verified this session).';

-- ---------------------------------------------------------------------------
-- Admin helpers: same signature and body, plus the AAL2 condition
-- ---------------------------------------------------------------------------
create or replace function is_admin_of_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select session_is_aal2()
     and exists (
       select 1
       from profiles p
       join clients c on c.organisation_id = p.organisation_id
       where p.id = auth.uid()
         and p.role = 'admin'
         and p.is_active
         and c.id = p_client_id
     );
$$;

create or replace function current_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id
  from profiles
  where id = auth.uid()
    and is_active
    and (role <> 'admin' or session_is_aal2());
$$;

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
  if not session_is_aal2() then
    raise exception 'not permitted: complete two-factor sign-in first' using errcode = '42501';
  end if;
  return v_org;
end;
$$;

revoke all on function admin_current_org_id() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Shift reassignment guard
-- ---------------------------------------------------------------------------
create or replace function shifts_before_update_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_org uuid;
  v_carer_org uuid;
begin
  select organisation_id into v_client_org from clients where id = new.client_id;
  select organisation_id into v_carer_org from profiles where id = new.carer_id and role = 'carer';

  if v_carer_org is null or v_carer_org is distinct from v_client_org then
    raise exception 'carer must belong to the same organisation as the client'
      using errcode = '42501';
  end if;

  -- Never trusted from the caller, as on insert.
  new.organisation_id := v_client_org;
  return new;
end;
$$;

create trigger shifts_before_update_assignment_trg
  before update of carer_id, client_id, organisation_id on shifts
  for each row
  when (
    old.carer_id is distinct from new.carer_id
    or old.client_id is distinct from new.client_id
    or old.organisation_id is distinct from new.organisation_id
  )
  execute function shifts_before_update_assignment();
