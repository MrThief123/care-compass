-- [CAR-05] Carer calendar shifts (PD-041, CHG-030, CHG-032)
--
-- A carer's calendar must name the client on shifts that have ended, but PD-041 hides a
-- client from a carer once their last shift ends, so plain RLS would show blank names.
-- This function returns the caller's own non-cancelled shifts with the client's name only
-- (no other client data). It answers only for the signed-in caller.

create or replace function get_carer_shifts(p_carer_id uuid, p_from timestamptz, p_to timestamptz)
returns table (
  id uuid,
  carer_id uuid,
  client_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  client_first_name text,
  client_last_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.carer_id, s.client_id, s.starts_at, s.ends_at, c.first_name, c.last_name
  from shifts s
  join clients c on c.id = s.client_id
  where p_carer_id = auth.uid()
    and s.carer_id = auth.uid()
    and s.cancelled_at is null
    and s.starts_at >= p_from
    and s.starts_at < p_to
  order by s.starts_at;
$$;

revoke all on function get_carer_shifts(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function get_carer_shifts(uuid, timestamptz, timestamptz) to authenticated;
