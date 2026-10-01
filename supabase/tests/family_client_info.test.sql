-- [FAM-09] Family — Client info: RLS on client_info_sections, documents and the
-- `client-documents` bucket, from the family side
-- (docs/development/family-dev/family-client-info/ACCEPTANCE_CRITERIA.md).
-- Covers AC-04 (T-04): the client's family writes; an unlinked family member and another
-- organisation's admin do not; the client's own admin may (CAR-04 FD-07, FAM-09 FD-05).
-- AC-09 (T-08): a family save is audited. AC-05 (T-09): family can add a client-level document.
-- The CAR-04 migration already carries these rules, so some of these pass on first run;
-- a failure here means a family rule is missing and needs a migration (FD-02).
begin;
select plan(12);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Doyle'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Walter', 'Quill');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'gina@example.com');

-- Helen (family of Margaret), Priya (admin, Margaret's organisation), Wendy (admin, another
-- organisation), Gina (family of Walter only, so unlinked to Margaret).
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a5555555-5555-5555-5555-555555555555', 'family', null, 'Gina', 'Quill', true);

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter'),
  ('b2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555', 'Daughter');

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
-- Helen: family of Margaret. Writes sections and adds client-level documents.
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select lives_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'description', 'Lives independently.', 'a1111111-1111-1111-1111-111111111111')$$,
  '[FAM-09][AC-04] Helen can add Margaret''s Description'
);
update client_info_sections
  set body = 'Tea at 6am, then a walk.', updated_by = 'a1111111-1111-1111-1111-111111111111'
  where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits';
select is(
  (select body from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits'),
  'Tea at 6am, then a walk.',
  '[FAM-09][AC-01] Helen can change Margaret''s Habits and reads the new text back'
);
select lives_ok(
  $$insert into documents (client_id, event_id, filename, mime_type, size_bytes, storage_path, uploaded_by)
    values ('b1111111-1111-1111-1111-111111111111', null, 'Care plan.pdf', 'application/pdf', 10,
            'clients/b1111111-1111-1111-1111-111111111111/d1111111-1111-1111-1111-111111111111/Care plan.pdf',
            'a1111111-1111-1111-1111-111111111111')$$,
  '[FAM-09][AC-05] Helen can add a client-level document row (event_id null)'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('client-documents',
            'clients/b1111111-1111-1111-1111-111111111111/d1111111-1111-1111-1111-111111111111/Care plan.pdf',
            'a1111111-1111-1111-1111-111111111111')$$,
  '[FAM-09][AC-05] Helen can upload into Margaret''s folder'
);
reset role;

select is(
  (select count(*)::int from audit_log
    where table_name = 'client_info_sections'
      and actor_id = 'a1111111-1111-1111-1111-111111111111'
      and actor_role = 'family'
      and client_id = 'b1111111-1111-1111-1111-111111111111'
      and action in ('INSERT', 'UPDATE')),
  2,
  '[FAM-09][AC-09] both of Helen''s saves are audited, with her as the family actor and Margaret as the client'
);

-- ---------------------------------------------------------------------------
-- Gina: family of a different client. Reads nothing of Margaret's, writes nothing.
-- ---------------------------------------------------------------------------
select pg_temp.login('a5555555-5555-5555-5555-555555555555');

select is(
  (select count(*)::int from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  '[FAM-09][AC-04] an unlinked family member cannot read Margaret''s sections'
);
select throws_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'medical_history', 'Sneaky', 'a5555555-5555-5555-5555-555555555555')$$,
  '42501', null,
  '[FAM-09][AC-04] an unlinked family member cannot insert a section for Margaret'
);
update client_info_sections set body = 'Sneaky' where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits';
select throws_ok(
  $$insert into documents (client_id, filename, mime_type, size_bytes, storage_path, uploaded_by)
    values ('b1111111-1111-1111-1111-111111111111', 'Sneaky.pdf', 'application/pdf', 10,
            'clients/b1111111-1111-1111-1111-111111111111/d2222222-2222-2222-2222-222222222222/Sneaky.pdf',
            'a5555555-5555-5555-5555-555555555555')$$,
  '42501', null,
  '[FAM-09][AC-04] an unlinked family member cannot add a document row for Margaret'
);
reset role;

-- ---------------------------------------------------------------------------
-- Wendy: admin of another organisation. No write.
-- ---------------------------------------------------------------------------
select pg_temp.login('a4444444-4444-4444-4444-444444444444');

select throws_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'medical_history', 'Sneaky', 'a4444444-4444-4444-4444-444444444444')$$,
  '42501', null,
  '[FAM-09][AC-04] another organisation''s admin cannot insert a section for Margaret'
);
update client_info_sections set body = 'Sneaky' where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits';
reset role;

select is(
  (select body from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits'),
  'Tea at 6am, then a walk.',
  '[FAM-09][AC-04] neither Gina''s nor Wendy''s update changed Margaret''s Habits'
);

-- ---------------------------------------------------------------------------
-- Priya: admin of Margaret's own organisation. May write (CAR-04 FD-07).
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');

select lives_ok(
  $$insert into client_info_sections (client_id, key, body, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'medical_history', 'Type 2 diabetes.', 'a2222222-2222-2222-2222-222222222222')$$,
  '[FAM-09][AC-04] Priya, admin of Margaret''s own organisation, can write (FD-05, supersedes D28)'
);
reset role;

select is(
  (select count(*)::int from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  3,
  '[FAM-09][AC-04] Margaret ends with her three sections, none of them written by a refused user'
);

select * from finish();
rollback;
