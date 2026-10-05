-- Ticking a task Done is the carer's act alone: the carer on an active shift for the client.
-- Before, the client's family and an organisation admin could also tick (OQ-09, ADM-11 FD-01); a
-- tick says care was delivered, which only the person who delivered it can say. Undo is unchanged
-- (the family or an admin can still undo a tick, OQ-10). Additive: only the function body changes.

create or replace function set_occurrence_done(p_event_id uuid, p_original_start timestamptz)
returns care_event_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event care_events;
  v_override care_event_overrides;
  v_latest care_event_completions;
  v_profile profiles;
  v_row care_event_completions;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_event_id is null or p_original_start is null then
    raise exception 'an event and an occurrence are required' using errcode = '22023';
  end if;

  select * into v_event from care_events where id = p_event_id;
  if not found then
    raise exception 'that event does not exist' using errcode = 'P0002';
  end if;

  -- Only the carer on an active shift for the client says care was delivered. The family and an
  -- admin of the client's organisation read the status but never set it.
  if not (
    carer_on_active_shift(v_event.client_id)
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_active and p.role = 'carer'
    )
  ) then
    raise exception 'only the carer on shift can tick off this client''s care' using errcode = '42501';
  end if;

  if p_original_start < v_event.starts_at then
    raise exception 'that occurrence is before the event''s first one' using errcode = '22023';
  end if;

  -- One tick-off per occurrence at a time.
  perform pg_advisory_xact_lock(hashtextextended(p_event_id::text || '|' || p_original_start::text, 0));

  select * into v_override
  from care_event_overrides
  where event_id = p_event_id and original_start = p_original_start;

  if found and v_override.kind = 'cancelled' then
    raise exception 'that occurrence is cancelled' using errcode = '22023';
  end if;

  if coalesce(v_override.new_completion_mode, v_event.completion_mode) <> 'manual' then
    raise exception 'a plain event has no status and cannot be ticked off' using errcode = '22023';
  end if;

  select * into v_latest
  from care_event_completions
  where event_id = p_event_id and original_start = p_original_start
  order by seq desc
  limit 1;

  if found and v_latest.action = 'done' then
    return v_latest;
  end if;

  select * into v_profile from profiles where id = auth.uid();

  insert into care_event_completions
    (event_id, client_id, original_start, action, actor_id, actor_display_name, organisation_id)
  values (
    p_event_id,
    v_event.client_id,
    p_original_start,
    'done',
    auth.uid(),
    coalesce(nullif(trim(coalesce(v_profile.first_name, '') || ' ' || coalesce(v_profile.last_name, '')), ''), 'Unknown'),
    v_profile.organisation_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function set_occurrence_done(uuid, timestamptz) from public, anon;
grant execute on function set_occurrence_done(uuid, timestamptz) to authenticated;
