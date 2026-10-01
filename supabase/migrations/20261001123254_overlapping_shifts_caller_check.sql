-- [F0-21] Auth security audit: overlapping_shifts checks its caller (AC-03, IDOR).
--
-- HUMAN REVIEW, together with 20261001121303_admin_aal2_rls.sql. Tested on an isolated local stack
-- only.
--
-- overlapping_shifts(carer, from, to) (F0-10) is SECURITY DEFINER, so the shifts RLS policies do
-- not apply inside it, and it had no caller check and the default EXECUTE grant to PUBLIC. Any
-- signed-in user (and the anon role) could name any carer's id and read that carer's shift rows,
-- client ids included, across organisations. Found by ADM-07, which stopped calling it.
--
-- It is documented as "a soft admin warning only" (D30), so it now answers only an active admin of
-- the carer's own organisation with an AAL2 session (admin_current_org_id(), which raises 42501
-- otherwise), and only with that organisation's shifts. Same signature and return type: callers
-- that were allowed keep working. EXECUTE is revoked from PUBLIC and anon and granted to
-- authenticated, matching the other SECURITY DEFINER functions.

create or replace function overlapping_shifts(p_carer_id uuid, p_starts_at timestamptz, p_ends_at timestamptz)
returns setof shifts
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid := admin_current_org_id();
begin
  if not exists (
    select 1 from profiles p
    where p.id = p_carer_id and p.role = 'carer' and p.organisation_id = v_org
  ) then
    raise exception 'not permitted: that carer is not in your organisation' using errcode = '42501';
  end if;

  return query
    select s.*
    from shifts s
    where s.carer_id = p_carer_id
      and s.organisation_id = v_org
      and s.cancelled_at is null
      and s.starts_at < p_ends_at
      and s.ends_at > p_starts_at;
end;
$$;

revoke all on function overlapping_shifts(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function overlapping_shifts(uuid, timestamptz, timestamptz) to authenticated;
