-- [CAR-04] Carer — Client info: writes only while a shift is in progress (FD-01, FD-05)
--
-- Reading stays as F0-18 left it (family, or a carer with any non-cancelled shift that has
-- not ended, `is_assigned_carer`), plus an admin of the client's organisation (CAR-04
-- decision, 2026-09-30). Carer writing is narrower: a carer may edit a client's info
-- sections and add documents only while a shift with that client is in progress
-- (`carer_on_active_shift`, F0-10). Carers cannot delete
-- (there is no DELETE policy on any of these tables or on the bucket).
--
-- An admin of the client's organisation may read and write sections at any time.
--
-- Additive: the family policies on `client_info_sections` are untouched; only the
-- `documents` and `client-documents` INSERT policies are replaced, and the read and
-- detach paths keep using `can_access_client_documents`.

-- ---------------------------------------------------------------------------
-- client_info_sections: on-shift carer insert and update
-- `updated_by = auth.uid()` records the carer as the saver and stops one user
-- signing another's name.
-- ---------------------------------------------------------------------------
create policy client_info_sections_insert_carer on client_info_sections
  for insert
  with check (carer_on_active_shift(client_id) and updated_by = auth.uid());

create policy client_info_sections_update_carer on client_info_sections
  for update
  using (carer_on_active_shift(client_id))
  with check (carer_on_active_shift(client_id) and updated_by = auth.uid());

-- ---------------------------------------------------------------------------
-- client_info_sections: admin of the client's organisation reads and writes
-- ---------------------------------------------------------------------------
drop policy client_info_sections_select on client_info_sections;
create policy client_info_sections_select on client_info_sections
  for select
  using (
    is_family_of(client_id)
    or is_assigned_carer(client_id)
    or is_admin_of_client(client_id)
  );

create policy client_info_sections_insert_admin on client_info_sections
  for insert
  with check (is_admin_of_client(client_id) and updated_by = auth.uid());

create policy client_info_sections_update_admin on client_info_sections
  for update
  using (is_admin_of_client(client_id))
  with check (is_admin_of_client(client_id) and updated_by = auth.uid());

-- ---------------------------------------------------------------------------
-- documents and storage: uploads by family, an admin of the client's organisation, or a carer on shift.
-- Before this, `can_access_client_documents` let any carer with read access (a shift
-- scheduled for next week, or one that just ended) add files. Reads and detach are unchanged.
-- ---------------------------------------------------------------------------
create or replace function can_upload_client_documents(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_family_of(p_client_id)
      or is_admin_of_client(p_client_id)
      or carer_on_active_shift(p_client_id);
$$;

drop policy documents_insert on documents;
create policy documents_insert on documents
  for insert with check (uploaded_by = auth.uid() and can_upload_client_documents(client_id));

drop policy client_documents_insert on storage.objects;
create policy client_documents_insert on storage.objects
  for insert with check (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = 'clients'
    and can_upload_client_documents(((storage.foldername(name))[2])::uuid)
  );
