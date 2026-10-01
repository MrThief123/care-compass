-- [CAR-04] Carer — Client info: RLS on client_info_sections, documents and the
-- `client-documents` bucket (docs/development/carer-dev/carer-client-info/ACCEPTANCE_CRITERIA.md).
-- Covers AC-03 (T-03): a carer can read a client while a shift with them has not ended (PD-041,
-- F0-18) but can write only while a shift is in progress; an admin never writes; family
-- keeps its rights. Audit: AC-02's "recorded as saved by Aisha" rests on updated_by, checked in
-- tests/integration/carer-client-info.test.ts.
begin;
select plan(24);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Doyle');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a7777777-7777-7777-7777-777777777777', 'daniel@example.com'),
  ('a8888888-8888-8888-8888-888888888888', 'erin@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com');

-- Helen (family), Priya (admin), Aisha (carer: only a LATER shift with Margaret = off shift),
-- Daniel (carer: shift with Margaret in progress = on shift), Erin (carer: no shift at all).
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a7777777-7777-7777-7777-777777777777', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Kim', true),
  ('a8888888-8888-8888-8888-888888888888', 'carer', '11111111-1111-1111-1111-111111111111', 'Erin', 'Walsh', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true);

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter');

insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', now() - interval '1 hour', now() + interval '2 hours'),
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() + interval '3 hours', now() + interval '5 hours');

insert into client_info_sections (client_id, key, body) values
  ('b1111111-1111-1111-1111-111111111111', 'habits', 'Tea at 7am.');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Aisha: off shift (a later shift only). Reads yes, writes no.
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');

select is(
  (select count(*)::int from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  1,
  '[CAR-04][AC-03] off shift, Aisha can still read Margaret''s sections'
);
select throws_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'description', 'Sneaky', 'a3333333-3333-3333-3333-333333333333')$$,
  '42501', null,
  '[CAR-04][AC-03] off shift, Aisha cannot insert a section'
);
update client_info_sections set body = 'Sneaky' where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits';
reset role;
select is(
  (select body from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits'),
  'Tea at 7am.',
  '[CAR-04][AC-03] off shift, Aisha''s update of Habits changed nothing'
);

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$insert into documents (client_id, filename, mime_type, size_bytes, storage_path, uploaded_by)
    values ('b1111111-1111-1111-1111-111111111111', 'Sneaky.pdf', 'application/pdf', 10,
            'clients/b1111111-1111-1111-1111-111111111111/d3333333-3333-3333-3333-333333333333/Sneaky.pdf',
            'a3333333-3333-3333-3333-333333333333')$$,
  '42501', null,
  '[CAR-04][AC-03] off shift, Aisha cannot add a documents row'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('client-documents',
            'clients/b1111111-1111-1111-1111-111111111111/d3333333-3333-3333-3333-333333333333/Sneaky.pdf',
            'a3333333-3333-3333-3333-333333333333')$$,
  '42501', null,
  '[CAR-04][AC-03] off shift, Aisha cannot upload into Margaret''s folder'
);
reset role;

-- ---------------------------------------------------------------------------
-- Daniel: on shift. Writes yes.
-- ---------------------------------------------------------------------------
select pg_temp.login('a7777777-7777-7777-7777-777777777777');

select lives_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'description', 'Lives alone.', 'a7777777-7777-7777-7777-777777777777')$$,
  '[CAR-04][AC-03] on shift, Daniel can insert a section'
);
update client_info_sections set body = 'Tea at 6am.', updated_by = 'a7777777-7777-7777-7777-777777777777'
  where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits';
select is(
  (select body from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits'),
  'Tea at 6am.',
  '[CAR-04][AC-02][AC-03] on shift, Daniel can update Habits'
);
select lives_ok(
  $$insert into documents (id, client_id, filename, mime_type, size_bytes, storage_path, uploaded_by)
    values ('d4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'Diet sheet.pdf', 'application/pdf', 10,
            'clients/b1111111-1111-1111-1111-111111111111/d4444444-4444-4444-4444-444444444444/Diet sheet.pdf',
            'a7777777-7777-7777-7777-777777777777')$$,
  '[CAR-04][AC-07] on shift, Daniel can add a documents row'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('client-documents',
            'clients/b1111111-1111-1111-1111-111111111111/d4444444-4444-4444-4444-444444444444/Diet sheet.pdf',
            'a7777777-7777-7777-7777-777777777777')$$,
  '[CAR-04][AC-07] on shift, Daniel can upload into Margaret''s folder'
);
select is(
  (select count(*)::int from documents where client_id = 'b1111111-1111-1111-1111-111111111111'),
  1,
  '[CAR-04][AC-07] the carer reads the document he added'
);
reset role;

-- ---------------------------------------------------------------------------
-- The shift ends: Daniel's write is rejected (AC-05's database half).
-- ---------------------------------------------------------------------------
-- (A shift must satisfy starts_at < ends_at, so end it by moving both into the past.)
update shifts set starts_at = now() - interval '3 hours', ends_at = now() - interval '1 second'
  where carer_id = 'a7777777-7777-7777-7777-777777777777';

select pg_temp.login('a7777777-7777-7777-7777-777777777777');
select is(
  (select count(*)::int from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  '[CAR-04][AC-04] once his last shift has ended, Daniel reads no sections at all'
);
reset role;

-- ---------------------------------------------------------------------------
-- Erin: no shift with Margaret at all (AC-04): sees and writes nothing.
-- ---------------------------------------------------------------------------
select pg_temp.login('a8888888-8888-8888-8888-888888888888');
select is(
  (select count(*)::int from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  '[CAR-04][AC-04] Erin, with no shift, reads no sections'
);
select throws_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'medical_history', 'Sneaky', 'a8888888-8888-8888-8888-888888888888')$$,
  '42501', null,
  '[CAR-04][AC-03][AC-04] Erin cannot insert a section'
);
select is(
  (select count(*)::int from documents where client_id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  '[CAR-04][AC-04] Erin reads no documents'
);
reset role;

-- ---------------------------------------------------------------------------
-- An admin of the client's organisation reads and writes sections; another organisation's
-- admin does neither. Family keeps its rights.
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  2,
  '[CAR-04][AC-03] Priya (admin, same organisation) can read the sections'
);
savepoint admin_insert;
select lives_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'medical_history', 'Admin edit', 'a2222222-2222-2222-2222-222222222222')$$,
  '[CAR-04][AC-03] Priya (admin) can insert a section'
);
rollback to savepoint admin_insert;
update client_info_sections set body = 'Admin edit', updated_by = 'a2222222-2222-2222-2222-222222222222'
  where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits';
reset role;
select is(
  (select body from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits'),
  'Admin edit',
  '[CAR-04][AC-03] Priya (admin) can update a section'
);

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  '[CAR-04][AC-03] Wendy (admin, other organisation) reads no sections'
);
select throws_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'medical_history', 'Other org', 'a4444444-4444-4444-4444-444444444444')$$,
  '42501', null,
  '[CAR-04][AC-03] Wendy (admin, other organisation) cannot insert a section'
);
reset role;

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'medical_history', 'Hip replacement.', 'a1111111-1111-1111-1111-111111111111')$$,
  '[CAR-04] Helen (family) can still insert a section'
);
update client_info_sections set body = 'Tea at 5am.', updated_by = 'a1111111-1111-1111-1111-111111111111'
  where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits';
select is(
  (select body from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits'),
  'Tea at 5am.',
  '[CAR-04] Helen (family) can still update a section'
);
select lives_ok(
  $$insert into documents (client_id, filename, mime_type, size_bytes, storage_path, uploaded_by)
    values ('b1111111-1111-1111-1111-111111111111', 'Care plan.pdf', 'application/pdf', 10,
            'clients/b1111111-1111-1111-1111-111111111111/d5555555-5555-5555-5555-555555555555/Care plan.pdf',
            'a1111111-1111-1111-1111-111111111111')$$,
  '[CAR-04] Helen (family) can still add a document'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('client-documents',
            'clients/b1111111-1111-1111-1111-111111111111/d5555555-5555-5555-5555-555555555555/Care plan.pdf',
            'a1111111-1111-1111-1111-111111111111')$$,
  '[CAR-04] Helen (family) can still upload into her client''s folder'
);
reset role;

-- Aisha's shift starts in 3 hours and Daniel's is over: nobody else is on shift now, so a
-- second on-shift write by Aisha stays refused until her shift begins.
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'description', 'Not yet', 'a3333333-3333-3333-3333-333333333333')$$,
  '42501', null,
  '[CAR-04][AC-03] a shift that starts later gives no write access yet'
);
reset role;

select * from finish();
rollback;
