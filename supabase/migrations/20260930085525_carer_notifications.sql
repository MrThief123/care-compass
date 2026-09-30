-- [CAR-02] Carer notifications: table, recipient-only RLS, shift trigger (FD-01 to FD-06, CHG-025)
--
-- Only shift notifications exist (assigned, changed, cancelled), all from 'admin'. The 'family'
-- source stays in the check so a later feature can add it without a migration; nothing writes it.
-- Messages are built here, in Australia/Melbourne time, with the client's full name (FD-03).

create table carer_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id) on delete cascade,
  source text not null check (source in ('admin', 'family')),
  kind text not null check (kind in ('shift_assigned', 'shift_changed', 'shift_cancelled')),
  message text not null,
  client_id uuid references clients (id) on delete cascade,
  shift_id uuid references shifts (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index carer_notifications_recipient_created_idx
  on carer_notifications (recipient_id, created_at desc);

alter table carer_notifications enable row level security;

-- Nothing for anon; carers may read their own rows and set read_at on them, nothing else.
revoke all on carer_notifications from anon, authenticated;
grant select on carer_notifications to authenticated;
grant update (read_at) on carer_notifications to authenticated;

create policy carer_notifications_select_own on carer_notifications
  for select to authenticated
  using (recipient_id = auth.uid());

create policy carer_notifications_mark_read_own on carer_notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- One row per affected carer. SECURITY DEFINER so the insert does not depend on the caller's rights.
create or replace function notify_carer_of_shift_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client text;
  v_client_id uuid := new.client_id;

  -- 'Tuesday 1 Dec' and '09:00–11:00' for a shift row, in Melbourne time
  v_new_when text := to_char(new.starts_at at time zone 'Australia/Melbourne', 'FMDay FMDD Mon');
  v_new_span text := to_char(new.starts_at at time zone 'Australia/Melbourne', 'HH24:MI')
                     || '–' || to_char(new.ends_at at time zone 'Australia/Melbourne', 'HH24:MI');
begin
  select first_name || ' ' || last_name into v_client from clients where id = v_client_id;

  if tg_op = 'INSERT' then
    if new.cancelled_at is null then
      insert into carer_notifications (recipient_id, source, kind, message, client_id, shift_id)
      values (new.carer_id, 'admin', 'shift_assigned',
              format('New shift assigned: %s, %s (%s).', v_new_when, v_new_span, v_client),
              new.client_id, new.id);
    end if;
    return null;
  end if;

  -- A shift that was already cancelled notifies nobody on further updates.
  if old.cancelled_at is not null then
    return null;
  end if;

  if new.cancelled_at is not null then
    insert into carer_notifications (recipient_id, source, kind, message, client_id, shift_id)
    values (old.carer_id, 'admin', 'shift_cancelled',
            format('Shift cancelled: %s, %s (%s).',
                   to_char(old.starts_at at time zone 'Australia/Melbourne', 'FMDay FMDD Mon'),
                   to_char(old.starts_at at time zone 'Australia/Melbourne', 'HH24:MI')
                     || '–' || to_char(old.ends_at at time zone 'Australia/Melbourne', 'HH24:MI'),
                   v_client),
            old.client_id, old.id);
  elsif new.carer_id is distinct from old.carer_id then
    insert into carer_notifications (recipient_id, source, kind, message, client_id, shift_id)
    values
      (old.carer_id, 'admin', 'shift_cancelled',
       format('Shift cancelled: %s, %s (%s).',
              to_char(old.starts_at at time zone 'Australia/Melbourne', 'FMDay FMDD Mon'),
              to_char(old.starts_at at time zone 'Australia/Melbourne', 'HH24:MI')
                || '–' || to_char(old.ends_at at time zone 'Australia/Melbourne', 'HH24:MI'),
              v_client),
       old.client_id, old.id),
      (new.carer_id, 'admin', 'shift_assigned',
       format('New shift assigned: %s, %s (%s).', v_new_when, v_new_span, v_client),
       new.client_id, new.id);
  elsif new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at then
    insert into carer_notifications (recipient_id, source, kind, message, client_id, shift_id)
    values (new.carer_id, 'admin', 'shift_changed',
            format('Shift changed: %s now %s (%s).', v_new_when, v_new_span, v_client),
            new.client_id, new.id);
  end if;

  return null;
end;
$$;

create trigger shifts_notify_carer
  after insert or update on shifts
  for each row execute function notify_carer_of_shift_change();
