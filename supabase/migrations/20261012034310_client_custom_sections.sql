-- [F0-26] Custom sections on Client Details (CHG-061)
--
-- A client may have up to 20 extra info sections, each a title and some text, added under the
-- three built-in ones (description, habits, medical history in `client_info_sections`).
--
-- Who: family of the client, a carer whose shift with the client is in progress, and an admin
-- of the client's organisation (AAL2, via `is_admin_of_client`) read, add, rename, edit and
-- remove. Any carer with read access to the client (`is_assigned_carer`) reads. Every write
-- must carry `updated_by = auth.uid()`, so nobody saves under another user's name.
--
-- Rules the app also checks (src/server/clients/custom-section-input.ts): a trimmed title of
-- 1-60 characters, not a built-in title (or "Documentation"), unique per client in any case;
-- text of at most 5,000 characters; at most 20 sections per client.
--
-- Additive: a new table; nothing existing changes.

create table client_custom_info_sections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  title text not null check (
    title = btrim(title)
    and char_length(title) between 1 and 60
    and lower(title) not in ('description', 'habits', 'medical history', 'documentation')
  ),
  body text check (body is null or char_length(body) <= 5000),
  created_by uuid references profiles (id) default auth.uid(),
  updated_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index client_custom_info_sections_title_key
  on client_custom_info_sections (client_id, lower(title));

alter table client_custom_info_sections enable row level security;

-- ---------------------------------------------------------------------------
-- At most 20 sections per client. SECURITY DEFINER so the count sees every row whatever the
-- caller's RLS; the advisory lock stops two concurrent adds both taking the 20th place.
-- ---------------------------------------------------------------------------
create or replace function client_custom_info_sections_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('client_custom_info_sections:' || new.client_id::text));
  if (select count(*) from client_custom_info_sections where client_id = new.client_id) >= 20 then
    raise exception 'custom section limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger client_custom_info_sections_limit
  before insert on client_custom_info_sections
  for each row execute function client_custom_info_sections_limit();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
create policy client_custom_info_sections_select on client_custom_info_sections
  for select
  using (
    is_family_of(client_id)
    or is_assigned_carer(client_id)
    or is_admin_of_client(client_id)
  );

create policy client_custom_info_sections_insert on client_custom_info_sections
  for insert
  with check (
    (is_family_of(client_id) or carer_on_active_shift(client_id) or is_admin_of_client(client_id))
    and updated_by = auth.uid()
  );

create policy client_custom_info_sections_update on client_custom_info_sections
  for update
  using (is_family_of(client_id) or carer_on_active_shift(client_id) or is_admin_of_client(client_id))
  with check (
    (is_family_of(client_id) or carer_on_active_shift(client_id) or is_admin_of_client(client_id))
    and updated_by = auth.uid()
  );

create policy client_custom_info_sections_delete on client_custom_info_sections
  for delete
  using (is_family_of(client_id) or carer_on_active_shift(client_id) or is_admin_of_client(client_id));

-- ---------------------------------------------------------------------------
-- Audit (F0-09): every add, edit and removal, with the old title and text on removal.
-- ---------------------------------------------------------------------------
create trigger audit_client_custom_info_sections
  after insert or update or delete on client_custom_info_sections
  for each row execute function audit_row_change();
