-- [F0-23] Link uploaded documents to a new event (CHG-045)
-- Covers AC-01 to AC-05 (docs/development/shared/shared-document-event-linking/ACCEPTANCE_CRITERIA.md)
-- for `link_document_to_event(p_document_id, p_event_id)`.
begin;
select plan(24);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells'),
  ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Robert', 'Doyle');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'rosa@example.com'),
  ('a7777777-7777-7777-7777-777777777777', 'daniel@example.com');

-- Helen (family, Margaret), Priya (admin, Banksia), Aisha (carer on shift with Margaret),
-- Wendy (admin, Wattle), Rosa (family, Robert only), Daniel (carer, Banksia, no shift).
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a5555555-5555-5555-5555-555555555555', 'family', null, 'Rosa', 'Doyle', true),
  ('a7777777-7777-7777-7777-777777777777', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Kim', true);

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter'),
  ('b2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555', 'Daughter');

insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() - interval '1 hour', now() + interval '3 hours');

insert into care_events (id, client_id, title, description, starts_at, duration_minutes, completion_mode, created_by) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Physio', '', '2026-11-30 09:00:00+11', 30, 'manual', 'a1111111-1111-1111-1111-111111111111'),
  ('e2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Walk', '', '2026-11-30 14:00:00+11', 30, 'automatic', 'a1111111-1111-1111-1111-111111111111'),
  ('e4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 'Robert medication', '', '2026-11-30 08:00:00+11', 15, 'manual', 'a5555555-5555-5555-5555-555555555555');

-- Documents, inserted as the table owner so uploaded_by and state can be set directly.
insert into documents (id, client_id, event_id, storage_path, filename, mime_type, size_bytes, uploaded_by, detached_at) values
  ('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', null, 'clients/b1111111-1111-1111-1111-111111111111/d1111111-1111-1111-1111-111111111111/Physio referral.pdf', 'Physio referral.pdf', 'application/pdf', 1000, 'a1111111-1111-1111-1111-111111111111', null),
  ('d2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', null, 'clients/b1111111-1111-1111-1111-111111111111/d2222222-2222-2222-2222-222222222222/a.pdf', 'a.pdf', 'application/pdf', 1000, 'a1111111-1111-1111-1111-111111111111', null),
  ('d3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'clients/b1111111-1111-1111-1111-111111111111/d3333333-3333-3333-3333-333333333333/b.pdf', 'b.pdf', 'application/pdf', 1000, 'a1111111-1111-1111-1111-111111111111', null),
  ('d4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', null, 'clients/b1111111-1111-1111-1111-111111111111/d4444444-4444-4444-4444-444444444444/c.pdf', 'c.pdf', 'application/pdf', 1000, 'a1111111-1111-1111-1111-111111111111', now()),
  ('d5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', null, 'clients/b1111111-1111-1111-1111-111111111111/d5555555-5555-5555-5555-555555555555/d.pdf', 'd.pdf', 'application/pdf', 1000, 'a3333333-3333-3333-3333-333333333333', null),
  ('d6666666-6666-6666-6666-666666666666', 'b1111111-1111-1111-1111-111111111111', null, 'clients/b1111111-1111-1111-1111-111111111111/d6666666-6666-6666-6666-666666666666/e.pdf', 'e.pdf', 'application/pdf', 1000, 'a1111111-1111-1111-1111-111111111111', null);

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------
select has_function('public', 'link_document_to_event', array['uuid', 'uuid'], '[F0-23] link_document_to_event(uuid, uuid) exists');
select is(
  (select prosecdef from pg_proc where proname = 'link_document_to_event'),
  true,
  '[F0-23] link_document_to_event is SECURITY DEFINER'
);
select ok(
  not has_function_privilege('anon', 'public.link_document_to_event(uuid, uuid)', 'execute'),
  '[F0-23][AC-02] anon cannot execute link_document_to_event'
);
select ok(
  has_function_privilege('authenticated', 'public.link_document_to_event(uuid, uuid)', 'execute'),
  '[F0-23] authenticated can execute link_document_to_event'
);

-- ---------------------------------------------------------------------------
-- AC-01: the uploader links an unlinked document to a same-client event
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$select link_document_to_event('d1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111')$$,
  '[F0-23][AC-01] Helen links her own unlinked upload to Margaret''s event'
);
select is(
  (select event_id from documents where id = 'd1111111-1111-1111-1111-111111111111'),
  'e1111111-1111-1111-1111-111111111111'::uuid,
  '[F0-23][AC-01] the document''s event_id is the event'
);
select is(
  (select (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by, detached_at)::text
     from documents where id = 'd1111111-1111-1111-1111-111111111111'),
  '(b1111111-1111-1111-1111-111111111111,"clients/b1111111-1111-1111-1111-111111111111/d1111111-1111-1111-1111-111111111111/Physio referral.pdf","Physio referral.pdf",application/pdf,1000,a1111111-1111-1111-1111-111111111111,)',
  '[F0-23][AC-01] nothing else on the row changed'
);
reset role;
select is(
  (select count(*)::int from audit_log
    where table_name = 'documents' and action = 'UPDATE'
      and record_id = 'd1111111-1111-1111-1111-111111111111'
      and after ->> 'event_id' = 'e1111111-1111-1111-1111-111111111111'),
  1,
  '[F0-23][AC-01] the link is in the audit log'
);

-- ---------------------------------------------------------------------------
-- AC-03: already linked, or detached
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$select link_document_to_event('d1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222')$$,
  '42501', null,
  '[F0-23][AC-03] a document already linked cannot be relinked'
);
select throws_ok(
  $$select link_document_to_event('d3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  '[F0-23][AC-03] a document linked on upload cannot be moved to another event'
);
select throws_ok(
  $$select link_document_to_event('d4444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  '[F0-23][AC-03] a detached document cannot be linked'
);
select is(
  (select event_id from documents where id = 'd1111111-1111-1111-1111-111111111111'),
  'e1111111-1111-1111-1111-111111111111'::uuid,
  '[F0-23][AC-03] the first link stands'
);

-- ---------------------------------------------------------------------------
-- AC-04: other client's event, unknown ids
-- ---------------------------------------------------------------------------
select throws_ok(
  $$select link_document_to_event('d2222222-2222-2222-2222-222222222222', 'e4444444-4444-4444-4444-444444444444')$$,
  '42501', null,
  '[F0-23][AC-04] a document cannot be linked to another client''s event'
);
select throws_ok(
  $$select link_document_to_event('d2222222-2222-2222-2222-222222222222', 'e9999999-9999-9999-9999-999999999999')$$,
  '42501', null,
  '[F0-23][AC-04] an unknown event is refused'
);
select throws_ok(
  $$select link_document_to_event('d9999999-9999-9999-9999-999999999999', 'e1111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  '[F0-23][AC-04] an unknown document is refused'
);
select throws_ok(
  $$select link_document_to_event(null, 'e1111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  '[F0-23][AC-04] a null document id is refused'
);
select is(
  (select event_id from documents where id = 'd2222222-2222-2222-2222-222222222222'),
  null::uuid,
  '[F0-23][AC-04] the document is unchanged after the refusals'
);

-- ---------------------------------------------------------------------------
-- AC-05: access and ownership
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$select link_document_to_event('d6666666-6666-6666-6666-666666666666', 'e1111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  '[F0-23][AC-05] Aisha (access, but not the uploader) cannot link Helen''s upload'
);
select lives_ok(
  $$select link_document_to_event('d5555555-5555-5555-5555-555555555555', 'e1111111-1111-1111-1111-111111111111')$$,
  '[F0-23][AC-05] Aisha can link her own upload'
);

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select throws_ok(
  $$select link_document_to_event('d6666666-6666-6666-6666-666666666666', 'e1111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  '[F0-23][AC-02] Rosa (another family) cannot link Margaret''s document'
);

select pg_temp.login('a7777777-7777-7777-7777-777777777777');
select throws_ok(
  $$select link_document_to_event('d6666666-6666-6666-6666-666666666666', 'e1111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  '[F0-23][AC-02] Daniel (carer with no shift) cannot link Margaret''s document'
);

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select throws_ok(
  $$select link_document_to_event('d6666666-6666-6666-6666-666666666666', 'e1111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  '[F0-23][AC-02] Wendy (admin of another organisation) cannot link Margaret''s document'
);

reset role;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);
set local role authenticated;
select throws_ok(
  $$select link_document_to_event('d6666666-6666-6666-6666-666666666666', 'e1111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  '[F0-23][AC-02] a caller with no session is refused'
);
reset role;
select is(
  (select event_id from documents where id = 'd6666666-6666-6666-6666-666666666666'),
  null::uuid,
  '[F0-23][AC-02] Helen''s other document is still unlinked'
);

select * from finish();
rollback;
