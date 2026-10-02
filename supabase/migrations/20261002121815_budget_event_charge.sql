-- FAM-11 (FD-07): a plain event with a cost is charged once, in full, after it ends.
-- Tasks are charged by care_event_completions_charge_cost when ticked Done. A plain event is never ticked
-- (CHG-009), so the app calls charge_ended_event_occurrences when Budget or Family home loads.
-- Additive: one column, one trigger, one function. Nothing existing is changed.

-- When the event's cost was last set or changed; null with no cost. An occurrence that started before it is
-- never charged, so a cost added to an old event is not billed for the past.
alter table care_events add column cost_set_at timestamptz;

create or replace function care_events_stamp_cost_set_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.cost is null then
    new.cost_set_at := null;
  elsif tg_op = 'INSERT'
     or old.cost is distinct from new.cost
     or old.bucket_id is distinct from new.bucket_id then
    new.cost_set_at := now();
  end if;
  return new;
end;
$$;

create trigger care_events_stamp_cost_set_at_trg
  before insert or update of cost, bucket_id on care_events
  for each row execute function care_events_stamp_cost_set_at();

-- charge_ended_event_occurrences(client, items): items is a jsonb array of {event_id, original_start}, the
-- ended occurrences the app found. Each is charged once (the one-per-occurrence key makes a repeat do nothing),
-- paid if nothing older is pending and the bucket covers it in full, otherwise held whole as pending (PD-058).
-- Skipped: another client's event, an event with no cost or bucket, a removed bucket, an occurrence that has not
-- started yet or started before the cost was set. Returns how many were charged.
-- Errors: 42501 not signed in, or not the client's family or an admin of their organisation.
create or replace function charge_ended_event_occurrences(p_client_id uuid, p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_event care_events;
  v_bucket budget_buckets;
  v_paid boolean;
  v_charged integer := 0;
  v_rows integer;
begin
  if auth.uid() is null or not can_edit_budget(p_client_id) then
    raise exception 'not permitted to change this budget' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items must be a list' using errcode = '22023';
  end if;

  for v_item in
    select (i ->> 'event_id')::uuid as event_id, (i ->> 'original_start')::timestamptz as original_start
    from jsonb_array_elements(p_items) i
    order by 2, 1
  loop
    select * into v_event from care_events where id = v_item.event_id and client_id = p_client_id;
    if not found
       or v_event.cost is null or v_event.bucket_id is null
       or v_event.cost_set_at is null
       or v_item.original_start > now()
       or v_item.original_start < v_event.cost_set_at then
      continue;
    end if;

    select * into v_bucket from budget_buckets where id = v_event.bucket_id for update;
    if not found or v_bucket.removed_at is not null then
      continue;
    end if;

    v_paid := not exists (select 1 from budget_costs where bucket_id = v_bucket.id and status = 'pending')
          and v_event.cost <= budget_bucket_balance(v_bucket.id);

    insert into budget_costs
      (bucket_id, client_id, event_id, original_start, description, amount, status, incurred_on, paid_on, recorded_by, recorded_by_name)
    values (
      v_bucket.id, p_client_id, v_event.id, v_item.original_start, v_event.title, v_event.cost,
      case when v_paid then 'paid' else 'pending' end,
      budget_today(),
      case when v_paid then budget_today() end,
      auth.uid(), budget_actor_name()
    )
    on conflict (event_id, original_start) do nothing;

    get diagnostics v_rows = row_count;
    v_charged := v_charged + v_rows;
  end loop;

  return v_charged;
end;
$$;

revoke all on function charge_ended_event_occurrences(uuid, jsonb) from public, anon, authenticated;
grant execute on function charge_ended_event_occurrences(uuid, jsonb) to authenticated;
