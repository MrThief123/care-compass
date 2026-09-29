-- [F0-13] Client document storage (PD-051, CIS3)
--
-- One secure pipeline for every file tile in the UI: care plans, reports, photos and
-- receipts. Metadata lives in `documents`; the file itself lives in the private
-- `client-documents` Storage bucket, at `clients/{client_id}/{document_id}/{filename}`.
-- Access to both mirrors the same rule a client's other records already use
-- (`is_family_of`, `is_assigned_carer`, `is_admin_of_client`, F0-06): family at any
-- time, an assigned carer, or an admin of the client's organisation. A later feature
-- may narrow uploads further; nothing here assumes more than "can access the client".
--
-- Allowed file types and the 20MB limit are PD-051 (OQ-26), enforced three times:
-- the Storage bucket's own `allowed_mime_types`/`file_size_limit` (defence at the
-- API), a CHECK constraint here (defence at the row), and — because both of those
-- trust the declared MIME type — a file-signature check in `uploadDocument`
-- (src/server/documents/actions.ts) before either is reached (PRD Security).
--
-- Retained in perpetuity (CIS3): there is no DELETE policy, and a trigger rejects
-- DELETE outright, even for the table owner or the service role, the same way
-- `audit_log` and `care_event_completions` are made append-only (F0-08, F0-11).
-- `detachDocument` sets `detached_at` instead; the row and the object stay.

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  event_id uuid references care_events (id) on delete set null,
  storage_path text not null unique,
  filename text not null,
  -- Kept in sync with the bucket's allowed_mime_types below (PD-051).
  mime_type text not null check (
    mime_type in (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/heif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20 * 1024 * 1024),
  uploaded_by uuid references profiles (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  -- Perpetual retention (CIS3): set instead of deleting; the row and the Storage
  -- object are unchanged. Excluded from "documents for this event/client" listings.
  detached_at timestamptz
);

alter table documents enable row level security;

create index documents_client_id_idx on documents (client_id);
create index documents_event_id_idx on documents (event_id) where detached_at is null;

-- ---------------------------------------------------------------------------
-- Append-only guard (F0-08/F0-11 pattern): no one can hard-delete a document,
-- including the table owner and the service role, which bypass RLS and grants.
-- ---------------------------------------------------------------------------
create or replace function documents_reject_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'documents cannot be deleted: detach it instead (detached_at)'
    using errcode = '42501';
end;
$$;

create trigger documents_no_delete
  before delete on documents
  for each row execute function documents_reject_delete();

-- ---------------------------------------------------------------------------
-- Access (mirrors client access generally, PRD Description; F0-06 helpers)
-- ---------------------------------------------------------------------------
create or replace function can_access_client_documents(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_family_of(p_client_id)
      or is_assigned_carer(p_client_id)
      or is_admin_of_client(p_client_id);
$$;

create policy documents_select on documents
  for select using (can_access_client_documents(client_id));

create policy documents_insert on documents
  for insert with check (uploaded_by = auth.uid() and can_access_client_documents(client_id));

-- Only `detached_at` is writable (column grant below); nothing else about an
-- uploaded document can change, matching profiles_update_self's pattern (F0-06).
create policy documents_update on documents
  for update using (can_access_client_documents(client_id))
  with check (can_access_client_documents(client_id));

revoke update on documents from anon, authenticated;
grant update (detached_at) on documents to authenticated;
grant select, insert on documents to authenticated;

create trigger audit_documents
  after insert or update or delete on documents
  for each row execute function audit_row_change();

-- ---------------------------------------------------------------------------
-- Storage bucket and its own RLS, mirroring `documents` row access
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- `storage.foldername(name)` on 'clients/{client_id}/{document_id}/{filename}' is
-- ARRAY['clients', client_id, document_id]; segment 2 is the client id. A path
-- that doesn't start with 'clients/<uuid>/...' matches no policy and is refused —
-- there is no general-purpose access to this bucket's objects.
create policy client_documents_select on storage.objects
  for select using (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = 'clients'
    and can_access_client_documents(((storage.foldername(name))[2])::uuid)
  );

create policy client_documents_insert on storage.objects
  for insert with check (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = 'clients'
    and can_access_client_documents(((storage.foldername(name))[2])::uuid)
  );

-- No update or delete policy: an uploaded object is never replaced or removed
-- (the same perpetual-retention rule as the `documents` row).
