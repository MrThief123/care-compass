-- [CAR-04] Carer — Client info: writes only while a shift is in progress (FD-01, FD-05)
--
-- Reading stays as F0-18 left it: family, or a carer with any non-cancelled shift that has
-- not ended (`is_assigned_carer`). Writing is narrower: a carer may edit a client's info
-- sections and add documents only while a shift with that client is in progress
-- (`carer_on_active_shift`, F0-10). Admins never write client info. Carers cannot delete
-- (there is no DELETE policy on any of these tables or on the bucket).
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
-- documents and storage: uploads by family, or by a carer on shift.
-- Before this, `can_access_client_documents` let any carer with read access (a shift
-- scheduled for next week, or one that just ended) and any admin of the organisation add
-- files. Reads and detach are unchanged.
-- ---------------------------------------------------------------------------
create or replace function can_upload_client_documents(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_family_of(p_client_id)
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
