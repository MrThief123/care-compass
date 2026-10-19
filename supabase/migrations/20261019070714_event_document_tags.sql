-- [F0-29] Tags on events and documents (CHG-064)
--
-- Each client has its own list of tags (`client_tags`), made by the family as they go. A care
-- event and a document each carry up to 10 of them (`care_event_tags`, `document_tags`). The Task
-- log and the Documents page filter by one.
--
-- Who: family of the client, an assigned carer and an admin of the client's organisation read
-- (as `documents`; an event's tags as its events). Only the family writes, and only through
-- `set_event_tags` / `set_document_tags`: SECURITY DEFINER, `is_family_of`, else 42501. Each
-- replaces the item's whole set and adds any new name to the client's list. Nobody writes the
-- tables directly (no grants), so a link's event or document and its tag always share a client.
--
-- Name rules the app also checks (src/server/tags/tag-input.ts): no control characters; trimmed,
-- inner whitespace collapsed to one space; 1-30 characters; one tag per name per client in any
-- case (the first spelling saved is kept); at most 10 per item. A bad list is 22023.
--
-- Additive: three new tables and three functions; nothing existing changes.

create table client_tags (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  name text not null check (
    name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
    and char_length(name) between 1 and 30
    and name !~ '[[:cntrl:]]'
  ),
  created_by uuid default auth.uid() references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index client_tags_name_key on client_tags (client_id, lower(name));

create table care_event_tags (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  event_id uuid not null references care_events (id) on delete cascade,
  tag_id uuid not null references client_tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, tag_id)
);

-- The Task log's "events with this tag" read.
create index care_event_tags_client_id_tag_id_idx on care_event_tags (client_id, tag_id);

create table document_tags (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  document_id uuid not null references documents (id) on delete cascade,
  tag_id uuid not null references client_tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (document_id, tag_id)
);

create index document_tags_client_id_idx on document_tags (client_id);

alter table client_tags enable row level security;
alter table care_event_tags enable row level security;
alter table document_tags enable row level security;

-- ---------------------------------------------------------------------------
-- RLS: read only. Writes go through the functions below.
-- ---------------------------------------------------------------------------
create policy client_tags_select on client_tags
  for select using (can_access_client_documents(client_id));

create policy care_event_tags_select on care_event_tags
  for select using (can_read_care_events(client_id));

create policy document_tags_select on document_tags
  for select using (can_access_client_documents(client_id));

revoke all on client_tags, care_event_tags, document_tags from anon, authenticated;
grant select on client_tags, care_event_tags, document_tags to authenticated;

-- ---------------------------------------------------------------------------
-- The ids of a client's tags for a list of names, adding the names that are new. Checks the
-- name rules (22023). Internal: called only by the two functions below.
-- ---------------------------------------------------------------------------
create or replace function client_tag_ids(p_client_id uuid, p_names text[])
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_names text[];
  v_name text;
  v_ids uuid[] := '{}';
  v_id uuid;
begin
  if exists (
    select 1 from unnest(coalesce(p_names, '{}')) as raw
    where raw is null or raw ~ '[[:cntrl:]]'
  ) then
    raise exception 'invalid tag name' using errcode = '22023';
  end if;

  -- Cleaned, one per name in any case, in the order given.
  select coalesce(array_agg(name order by ord), '{}') into v_names
  from (
    select distinct on (lower(name)) name, ord
    from (
      select btrim(regexp_replace(raw, '\s+', ' ', 'g')) as name, ord
      from unnest(coalesce(p_names, '{}')) with ordinality as given (raw, ord)
    ) cleaned
    order by lower(name), ord
  ) unique_names;

  if cardinality(v_names) > 10
     or exists (select 1 from unnest(v_names) as name where char_length(name) not between 1 and 30)
  then
    raise exception 'invalid tag list' using errcode = '22023';
  end if;

  foreach v_name in array v_names loop
    insert into client_tags (client_id, name) values (p_client_id, v_name)
      on conflict (client_id, lower(name)) do nothing;
    select id into v_id from client_tags
      where client_id = p_client_id and lower(name) = lower(v_name);
    v_ids := v_ids || v_id;
  end loop;
  return v_ids;
end;
$$;

revoke execute on function client_tag_ids(uuid, text[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- set_event_tags / set_document_tags: family of the client only; replaces the item's tags.
-- ---------------------------------------------------------------------------
create or replace function set_event_tags(p_event_id uuid, p_names text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_tag_ids uuid[];
begin
  select client_id into v_client_id from care_events where id = p_event_id;
  if v_client_id is null or not is_family_of(v_client_id) then
    raise exception 'not permitted to tag this event' using errcode = '42501';
  end if;

  v_tag_ids := client_tag_ids(v_client_id, p_names);
  delete from care_event_tags where event_id = p_event_id and tag_id <> all (v_tag_ids);
  insert into care_event_tags (client_id, event_id, tag_id)
    select v_client_id, p_event_id, tag_id from unnest(v_tag_ids) as tag_id
    on conflict (event_id, tag_id) do nothing;
end;
$$;

create or replace function set_document_tags(p_document_id uuid, p_names text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_tag_ids uuid[];
begin
  select client_id into v_client_id from documents
    where id = p_document_id and detached_at is null;
  if v_client_id is null or not is_family_of(v_client_id) then
    raise exception 'not permitted to tag this document' using errcode = '42501';
  end if;

  v_tag_ids := client_tag_ids(v_client_id, p_names);
  delete from document_tags where document_id = p_document_id and tag_id <> all (v_tag_ids);
  insert into document_tags (client_id, document_id, tag_id)
    select v_client_id, p_document_id, tag_id from unnest(v_tag_ids) as tag_id
    on conflict (document_id, tag_id) do nothing;
end;
$$;

revoke execute on function set_event_tags(uuid, text[]) from public, anon;
revoke execute on function set_document_tags(uuid, text[]) from public, anon;
grant execute on function set_event_tags(uuid, text[]) to authenticated;
grant execute on function set_document_tags(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Audit (F0-08): every tag made, and every tag put on or taken off an item.
-- ---------------------------------------------------------------------------
create trigger audit_client_tags
  after insert or update or delete on client_tags
  for each row execute function audit_row_change();

create trigger audit_care_event_tags
  after insert or update or delete on care_event_tags
  for each row execute function audit_row_change();

create trigger audit_document_tags
  after insert or update or delete on document_tags
  for each row execute function audit_row_change();
