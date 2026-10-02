-- [F0-23] Link an uploaded document to an event (CHG-045)
--
-- `documents` lets a client session update `detached_at` only (F0-13), so a file uploaded
-- on Add event, before the event exists, could never be linked to it afterwards. This adds
-- the one narrow way to set `event_id`: a SECURITY DEFINER function, the same pattern as
-- `transfer_client_organisation` (F0-06). Additive: one new function; no table, column,
-- grant or policy changes, so no other feature's reads change.
--
-- Because the function bypasses RLS it checks everything itself. It links only when:
--   * the caller is signed in and can access the document's client
--     (`can_access_client_documents`, F0-13);
--   * the caller uploaded the document (`uploaded_by`);
--   * the document has no event yet and is not detached;
--   * the event exists and belongs to the same client.
-- Every refusal raises the same generic error, so a caller learns nothing about which
-- check failed or whether a document or event exists. The existing `audit_documents`
-- trigger records the change.

create or replace function link_document_to_event(p_document_id uuid, p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
begin
  if auth.uid() is null or p_document_id is null or p_event_id is null then
    raise exception 'cannot link this document' using errcode = '42501';
  end if;

  select d.client_id
    into v_client_id
    from documents d
    join care_events e on e.id = p_event_id and e.client_id = d.client_id
   where d.id = p_document_id
     and d.event_id is null
     and d.detached_at is null
     and d.uploaded_by = auth.uid()
     and can_access_client_documents(d.client_id)
   for update of d;

  if v_client_id is null then
    raise exception 'cannot link this document' using errcode = '42501';
  end if;

  update documents set event_id = p_event_id where id = p_document_id;
end;
$$;

revoke all on function link_document_to_event(uuid, uuid) from public, anon, authenticated;
grant execute on function link_document_to_event(uuid, uuid) to authenticated;
