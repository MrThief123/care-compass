-- [F0-13] Client document storage
-- Covers AC-04 (T-04) (docs/development/shared/shared-document-storage/ACCEPTANCE_CRITERIA.md)
-- for the `documents` table and the `client-documents` bucket's RLS, plus the append-only
-- guarantee, the mime/size constraints (PD-051) and column-level update restrictions that
-- AC-01, AC-03 and AC-05 rest on. `uploadDocument`, `getDocumentUrl` and `detachDocument`
-- themselves (the app-level behaviour AC-01, AC-02, AC-03, AC-05 describe) are covered by
-- `tests/integration/documents.test.ts`.
begin;
select plan(43);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

-- Margaret and Robert both at Banksia, so admin-of-org tests are meaningful for both;
-- Robert's family (Rosa) is the "someone else's family" caller for AC-04.
insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells'),
  ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Robert', 'Doyle');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'rosa@example.com'),
  ('a6666666-6666-6666-6666-666666666666', 'nina@example.com'),
  ('a7777777-7777-7777-7777-777777777777', 'daniel@example.com');

-- Helen (family, Margaret), Priya (admin, Banksia), Aisha (carer, Banksia, assigned to
-- Margaret), Wendy (admin, Wattle — a different organisation), Rosa (family, Robert only —
-- AC-04's "Robert's family member"), Nina (family of no one), Daniel (carer, Banksia, not
-- assigned to Margaret).
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a5555555-5555-5555-5555-555555555555', 'family', null, 'Rosa', 'Doyle', true),
  ('a6666666-6666-6666-6666-666666666666', 'family', null, 'Nina', 'Ray', true),
  ('a7777777-7777-7777-7777-777777777777', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Kim', true);

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter'),
  ('b2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555', 'Daughter');

-- F0-18: read access follows shifts, not a separate assignment table.
insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() - interval '1 hour', now() + interval '3 hours');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------
select has_table('public', 'documents', '[F0-13] the documents table exists');
select columns_are(
  'public', 'documents',
  array[
    'id', 'client_id', 'event_id', 'storage_path', 'filename', 'mime_type', 'size_bytes',
    'uploaded_by', 'uploaded_at', 'detached_at'
  ],
  '[F0-13] documents has exactly the columns the data model specifies'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.documents'::regclass),
  true,
  '[F0-13] RLS is enabled on documents'
);

-- ---------------------------------------------------------------------------
-- can_access_client_documents(): family, assigned carer and same-org admin can, an
-- unrelated carer, a different organisation's admin and an unrelated family cannot.
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select ok(can_access_client_documents('b1111111-1111-1111-1111-111111111111'), '[F0-13] Helen (family) can access Margaret''s documents');
select ok(not can_access_client_documents('b2222222-2222-2222-2222-222222222222'), '[F0-13][AC-04] Helen cannot access Robert''s documents');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select ok(can_access_client_documents('b1111111-1111-1111-1111-111111111111'), '[F0-13] Aisha (assigned carer) can access Margaret''s documents');

select pg_temp.login('a7777777-7777-7777-7777-777777777777');
select ok(not can_access_client_documents('b1111111-1111-1111-1111-111111111111'), '[F0-13] Daniel (not assigned) cannot access Margaret''s documents');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select ok(can_access_client_documents('b1111111-1111-1111-1111-111111111111'), '[F0-13] Priya (admin, same org) can access Margaret''s documents');

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select ok(not can_access_client_documents('b1111111-1111-1111-1111-111111111111'), '[F0-13] Wendy (admin, other org) cannot access Margaret''s documents');

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select ok(not can_access_client_documents('b1111111-1111-1111-1111-111111111111'), '[F0-13][AC-04] Rosa (Robert''s family) cannot access Margaret''s documents');

select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select ok(not can_access_client_documents('b1111111-1111-1111-1111-111111111111'), '[F0-13] Nina (family of no one) cannot access Margaret''s documents');
reset role;

-- ---------------------------------------------------------------------------
-- documents row RLS: insert, select, and the mime/size constraints (PD-051)
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

create temp table margaret_doc as
with inserted as (
  insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by)
  values (
    'b1111111-1111-1111-1111-111111111111',
    'clients/b1111111-1111-1111-1111-111111111111/d1111111-1111-1111-1111-111111111111/Care plan.pdf',
    'Care plan.pdf', 'application/pdf', 84312, 'a1111111-1111-1111-1111-111111111111'
  )
  returning id
)
select id from inserted;

select isnt((select id from margaret_doc), null, '[F0-13][AC-01] Helen (family) can insert a document for Margaret');

select throws_ok(
  $$insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by)
    values ('b1111111-1111-1111-1111-111111111111', 'clients/b1111111-1111-1111-1111-111111111111/x/spoof.pdf',
            'spoof.pdf', 'application/pdf', 1000, 'a2222222-2222-2222-2222-222222222222')$$,
  '42501',
  null,
  '[F0-13] a caller cannot insert a document with someone else as uploaded_by'
);

select throws_ok(
  $$insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by)
    values ('b1111111-1111-1111-1111-111111111111', 'clients/b1111111-1111-1111-1111-111111111111/x/malware.exe',
            'malware.exe', 'application/x-msdownload', 1000, 'a1111111-1111-1111-1111-111111111111')$$,
  '23514',
  null,
  '[F0-13][PRD] a disallowed mime type is rejected at the database (defence in depth for AC-03)'
);

select throws_ok(
  $$insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by)
    values ('b1111111-1111-1111-1111-111111111111', 'clients/b1111111-1111-1111-1111-111111111111/x/huge.pdf',
            'huge.pdf', 'application/pdf', 21 * 1024 * 1024, 'a1111111-1111-1111-1111-111111111111')$$,
  '23514',
  null,
  '[F0-13][PRD] a file over 20MB is rejected at the database (defence in depth for AC-03)'
);

select throws_ok(
  $$insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by)
    values ('b1111111-1111-1111-1111-111111111111', 'clients/b1111111-1111-1111-1111-111111111111/x/empty.pdf',
            'empty.pdf', 'application/pdf', 0, 'a1111111-1111-1111-1111-111111111111')$$,
  '23514',
  null,
  '[F0-13][PRD] a zero-byte file is rejected at the database'
);

reset role;

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from documents where id = (select id from margaret_doc)),
  1,
  '[F0-13] Aisha (assigned carer) can see Margaret''s document'
);
reset role;

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from documents where id = (select id from margaret_doc)),
  1,
  '[F0-13] Priya (admin, same org) can see Margaret''s document'
);
reset role;

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from documents where id = (select id from margaret_doc)),
  0,
  '[F0-13][AC-04] Rosa (Robert''s family) cannot see Margaret''s document'
);
select throws_ok(
  format(
    $$insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by)
      values ('b1111111-1111-1111-1111-111111111111', 'clients/b1111111-1111-1111-1111-111111111111/x/spoof2.pdf',
              'spoof2.pdf', 'application/pdf', 1000, %L)$$,
    'a5555555-5555-5555-5555-555555555555'
  ),
  '42501',
  null,
  '[F0-13][AC-04] Rosa cannot insert a document for Margaret'
);
reset role;

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from documents where id = (select id from margaret_doc)),
  0,
  '[F0-13] Wendy (admin, other org) cannot see Margaret''s document'
);
reset role;

-- ---------------------------------------------------------------------------
-- Update: only detached_at is writable (mirrors profiles_update_self, F0-06)
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select throws_ok(
  format('update documents set filename = %L where id = %L', 'renamed.pdf', (select id from margaret_doc)),
  '42501',
  null,
  '[F0-13] filename cannot be changed once uploaded'
);
select throws_ok(
  format('update documents set mime_type = %L where id = %L', 'image/png', (select id from margaret_doc)),
  '42501',
  null,
  '[F0-13] mime_type cannot be changed once uploaded'
);

select lives_ok(
  format('update documents set detached_at = now() where id = %L', (select id from margaret_doc)),
  '[F0-13][AC-05] detaching a document (setting detached_at) is allowed'
);
select isnt(
  (select detached_at from documents where id = (select id from margaret_doc)),
  null,
  '[F0-13][AC-05] the document is now detached'
);
select is(
  (select count(*)::int from documents where id = (select id from margaret_doc)),
  1,
  '[F0-13][AC-05] the row still exists after detaching'
);
select is(
  (select count(*)::int from documents
   where client_id = 'b1111111-1111-1111-1111-111111111111' and detached_at is null),
  0,
  '[F0-13][AC-05] a detached document is excluded from an "active documents" listing'
);
reset role;

-- An UPDATE's USING clause filters which rows the command can even see, so it does not
-- raise for a caller with no access — it matches zero rows, silently. What matters is that
-- the row is provably unchanged, not that Rosa's statement errors.
create temp table detach_snapshot as
select detached_at from documents where id = (select id from margaret_doc);

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select lives_ok(
  format('update documents set detached_at = now() where id = %L', (select id from margaret_doc)),
  '[F0-13][AC-04] Rosa''s update runs without error (RLS matches no rows for her)'
);
reset role;
select is(
  (select detached_at from documents where id = (select id from margaret_doc)),
  (select detached_at from detach_snapshot),
  '[F0-13][AC-04] ...and Margaret''s document is unchanged: Rosa''s update touched nothing'
);

-- ---------------------------------------------------------------------------
-- No hard delete, for anyone, including the table owner (F0-08/F0-11 pattern).
-- Same RLS point as above: an ordinary user's DELETE has no policy to match against, so
-- it silently affects nothing (the row survives, no error). The trigger's job is to stop
-- a caller who *bypasses* RLS — the table owner or the service role — which is the only
-- way this table could otherwise be hard-deleted from.
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  format('delete from documents where id = %L', (select id from margaret_doc)),
  '[F0-13][PRD] its own uploader''s delete runs without error (RLS matches no rows: there is no DELETE policy)'
);
reset role;
select is(
  (select count(*)::int from documents where id = (select id from margaret_doc)),
  1,
  '[F0-13][PRD] ...and the document still exists: nothing was deleted'
);

select throws_ok(
  format('delete from documents where id = %L', (select id from margaret_doc)),
  '42501',
  null,
  '[F0-13][PRD] the table owner / service role (which bypasses RLS) is blocked by the trigger instead'
);
select is(
  (select count(*)::int from documents where id = (select id from margaret_doc)),
  1,
  '[F0-13][PRD] ...and the document still exists after that attempt too'
);

-- ---------------------------------------------------------------------------
-- Storage: the client-documents bucket exists with PD-051's limits, and its RLS
-- mirrors the documents row access above.
-- ---------------------------------------------------------------------------
select is(
  (select public from storage.buckets where id = 'client-documents'),
  false,
  '[F0-13][PRD] the client-documents bucket is private'
);
select is(
  (select file_size_limit from storage.buckets where id = 'client-documents'),
  20971520::bigint,
  '[F0-13][PRD] the bucket''s file size limit is 20MB (PD-051)'
);

insert into storage.objects (bucket_id, name, owner)
values (
  'client-documents',
  'clients/b1111111-1111-1111-1111-111111111111/d1111111-1111-1111-1111-111111111111/Care plan.pdf',
  'a1111111-1111-1111-1111-111111111111'
);
insert into storage.objects (bucket_id, name, owner)
values (
  'client-documents',
  'clients/b2222222-2222-2222-2222-222222222222/d2222222-2222-2222-2222-222222222222/Referral.pdf',
  'a5555555-5555-5555-5555-555555555555'
);

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'client-documents' and name like 'clients/b1111111-1111-1111-1111-111111111111/%'),
  1,
  '[F0-13][AC-01] Helen can see Margaret''s stored object'
);
reset role;

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'client-documents' and name like 'clients/b1111111-1111-1111-1111-111111111111/%'),
  1,
  '[F0-13] Aisha (assigned carer) can see Margaret''s stored object'
);
reset role;

select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'client-documents' and name like 'clients/b1111111-1111-1111-1111-111111111111/%'),
  0,
  '[F0-13][AC-04] Rosa cannot see Margaret''s stored object'
);
select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'client-documents' and name like 'clients/b2222222-2222-2222-2222-222222222222/%'),
  1,
  '[F0-13] Rosa can see Robert''s (her own client''s) stored object'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('client-documents',
            'clients/b1111111-1111-1111-1111-111111111111/dabcabca-abca-abca-abca-abcabcabcabc/Sneaky.pdf',
            'a5555555-5555-5555-5555-555555555555')$$,
  '42501',
  null,
  '[F0-13][AC-04] Rosa cannot upload into Margaret''s folder'
);
reset role;

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'client-documents' and name like 'clients/b1111111-1111-1111-1111-111111111111/%'),
  0,
  '[F0-13] Wendy (admin, other org) cannot see Margaret''s stored object'
);
reset role;

select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select is(
  (select count(*)::int from storage.objects where bucket_id = 'client-documents'),
  0,
  '[F0-13] Nina (unrelated to every client) sees no stored objects'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('client-documents', 'not-even-a-client-folder/file.pdf', 'a6666666-6666-6666-6666-666666666666')$$,
  '42501',
  null,
  '[F0-13][PRD] a path outside clients/<id>/... is refused'
);
reset role;

select * from finish();
rollback;
