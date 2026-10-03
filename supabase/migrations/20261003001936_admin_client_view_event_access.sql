-- ADM-11 (FD-01): an organisation admin does what the family can with a client's care events.
-- can_edit_care_events also returns true for is_admin_of_client (AAL2 and the client's current
-- organisation already required), and set_occurrence_undone lets an admin undo anyone's tick.
-- Additive: no table or column change; actor, created_by and recorded_by still come from auth.uid().

create or replace function can_edit_care_events(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_family_of(p_client_id)
      or is_admin_of_client(p_client_id)
      or (
        carer_on_active_shift(p_client_id)
        and exists (
          select 1 from profiles p
          where p.id = auth.uid() and p.is_active and p.role = 'carer'
        )
      );
$$;

create or replace function set_occurrence_undone(p_event_id uuid, p_original_start timestamptz)
returns care_event_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event care_events;
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

  -- Not an editor: refused before anything about the occurrence is revealed.
  if not can_edit_care_events(v_event.client_id) then
    raise exception 'not permitted to change this client''s care' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_event_id::text || '|' || p_original_start::text, 0));

  select * into v_latest
  from care_event_completions
  where event_id = p_event_id and original_start = p_original_start
  order by seq desc
  limit 1;

  if not found or v_latest.action <> 'done' then
    raise exception 'that occurrence is not marked Done' using errcode = '22023';
  end if;

  if not is_family_of(v_event.client_id) and not is_admin_of_client(v_event.client_id)
     and v_latest.actor_id <> auth.uid() then
    raise exception 'only the person who ticked it off, the family or an administrator can undo it' using errcode = '42501';
  end if;

  select * into v_profile from profiles where id = auth.uid();

  insert into care_event_completions
    (event_id, client_id, original_start, action, actor_id, actor_display_name, organisation_id)
  values (
    p_event_id,
    v_event.client_id,
    p_original_start,
    'undone',
    auth.uid(),
    coalesce(nullif(trim(coalesce(v_profile.first_name, '') || ' ' || coalesce(v_profile.last_name, '')), ''), 'Unknown'),
    v_profile.organisation_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function set_occurrence_undone(uuid, timestamptz) from public, anon, authenticated;
grant execute on function set_occurrence_undone(uuid, timestamptz) to authenticated;
