-- [F0-26] Custom sections on Client Details: RLS, constraints and audit on
-- client_custom_info_sections (docs/development/shared/shared-client-custom-sections/ACCEPTANCE_CRITERIA.md).
-- Covers AC-10 (T-04): family, an on-shift carer and an AAL2 admin of the client's organisation
-- read, add, rename and remove; an off-shift carer reads only; an unlinked family member, a carer
-- with no shift, another organisation's admin and an AAL1 admin get nothing. AC-03 and AC-08's
-- database half: title rules, uniqueness and the 20-section limit. AC-11: audit rows.
begin;
select plan(42);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Doyle'),
  ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Tom', 'Reid');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a7777777-7777-7777-7777-777777777777', 'daniel@example.com'),
  ('a8888888-8888-8888-8888-888888888888', 'erin@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a9999999-9999-9999-9999-999999999999', 'gary@example.com');

-- Helen (family of Margaret), Priya (admin, Margaret's organisation), Wendy (admin, another
-- organisation), Aisha (carer: only a LATER shift with Margaret = off shift), Daniel (carer: shift
-- in progress = on shift), Erin (carer: no shift), Gary (family of Tom only).
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a7777777-7777-7777-7777-777777777777', 'carer', '11111111-1111-1111-1111-111111111111', 'Daniel', 'Kim', true),
  ('a8888888-8888-8888-8888-888888888888', 'carer', '11111111-1111-1111-1111-111111111111', 'Erin', 'Walsh', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a9999999-9999-9999-9999-999999999999', 'family', null, 'Gary', 'Reid', true);

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter'),
  ('b2222222-2222-2222-2222-222222222222', 'a9999999-9999-9999-9999-999999999999', 'Son');

insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', now() - interval '1 hour', now() + interval '2 hours'),
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() + interval '3 hours', now() + interval '5 hours');

insert into client_custom_info_sections (id, client_id, title, body) values
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Communication', 'Uses short sentences.');

create or replace function pg_temp.login(p_user_id uuid, p_aal text default 'aal2') returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

select ok(
  (select relrowsecurity from pg_class where relname = 'client_custom_info_sections'),
  '[F0-26][AC-10] RLS is enabled on client_custom_info_sections'
);

-- ---------------------------------------------------------------------------
-- Helen (family): read, add, rename, edit, remove.
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select is(
  (select count(*)::int from client_custom_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  1,
  '[F0-26][AC-10] family reads the client''s custom sections'
);
select lives_ok(
  $$insert into client_custom_info_sections (id, client_id, title, body, updated_by)
    values ('c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Behaviours of concern', null, 'a1111111-1111-1111-1111-111111111111')$$,
  '[F0-26][AC-10] family adds a section'
);
update client_custom_info_sections
  set title = 'Behaviour support', body = 'Calm voice.', updated_by = 'a1111111-1111-1111-1111-111111111111'
  where id = 'c2222222-2222-2222-2222-222222222222';
select is(
  (select title || '|' || body from client_custom_info_sections where id = 'c2222222-2222-2222-2222-222222222222'),
  'Behaviour support|Calm voice.',
  '[F0-26][AC-10] family renames a section and edits its text'
);
delete from client_custom_info_sections where id = 'c2222222-2222-2222-2222-222222222222';
select is(
  (select count(*)::int from client_custom_info_sections where id = 'c2222222-2222-2222-2222-222222222222'),
  0,
  '[F0-26][AC-10] family removes a section'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'Signed as someone else', 'a7777777-7777-7777-7777-777777777777')$$,
  '42501', null,
  '[F0-26][AC-10] nobody can save under another user''s name'
);
select is(
  (select created_by from client_custom_info_sections where id = 'c1111111-1111-1111-1111-111111111111'),
  null::uuid,
  '[F0-26][AC-10] a row inserted without a session has no creator'
);
reset role;

-- ---------------------------------------------------------------------------
-- Daniel (carer on shift): add, edit, remove.
-- ---------------------------------------------------------------------------
select pg_temp.login('a7777777-7777-7777-7777-777777777777');

select lives_ok(
  $$insert into client_custom_info_sections (id, client_id, title, body, updated_by)
    values ('c3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Sleep', 'Wakes at 5am.', 'a7777777-7777-7777-7777-777777777777')$$,
  '[F0-26][AC-10] a carer on shift adds a section'
);
select is(
  (select created_by from client_custom_info_sections where id = 'c3333333-3333-3333-3333-333333333333'),
  'a7777777-7777-7777-7777-777777777777'::uuid,
  '[F0-26][AC-10] the creator is recorded from the session'
);
update client_custom_info_sections set body = 'Prefers pictures.', updated_by = 'a7777777-7777-7777-7777-777777777777'
  where id = 'c1111111-1111-1111-1111-111111111111';
select is(
  (select body from client_custom_info_sections where id = 'c1111111-1111-1111-1111-111111111111'),
  'Prefers pictures.',
  '[F0-26][AC-10] a carer on shift edits a section'
);
delete from client_custom_info_sections where id = 'c3333333-3333-3333-3333-333333333333';
select is(
  (select count(*)::int from client_custom_info_sections where id = 'c3333333-3333-3333-3333-333333333333'),
  0,
  '[F0-26][AC-10] a carer on shift removes a section'
);
reset role;

-- ---------------------------------------------------------------------------
-- Aisha (carer, off shift): reads, cannot write.
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');

select is(
  (select count(*)::int from client_custom_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  1,
  '[F0-26][AC-10] a carer off shift still reads the sections'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'Sneaky', 'a3333333-3333-3333-3333-333333333333')$$,
  '42501', null,
  '[F0-26][AC-10] a carer off shift cannot add a section'
);
update client_custom_info_sections set body = 'Sneaky', updated_by = 'a3333333-3333-3333-3333-333333333333'
  where id = 'c1111111-1111-1111-1111-111111111111';
delete from client_custom_info_sections where id = 'c1111111-1111-1111-1111-111111111111';
reset role;
select is(
  (select body from client_custom_info_sections where id = 'c1111111-1111-1111-1111-111111111111'),
  'Prefers pictures.',
  '[F0-26][AC-10] a carer off shift can neither edit nor remove a section'
);

-- ---------------------------------------------------------------------------
-- Erin (carer, no shift) and Gary (family of another client): nothing.
-- ---------------------------------------------------------------------------
select pg_temp.login('a8888888-8888-8888-8888-888888888888');
select is(
  (select count(*)::int from client_custom_info_sections),
  0,
  '[F0-26][AC-10] a carer with no shift reads nothing'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'Sneaky', 'a8888888-8888-8888-8888-888888888888')$$,
  '42501', null,
  '[F0-26][AC-10] a carer with no shift cannot add a section'
);
reset role;

select pg_temp.login('a9999999-9999-9999-9999-999999999999');
select is(
  (select count(*)::int from client_custom_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  '[F0-26][AC-10] a family member of another client reads nothing'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'Sneaky', 'a9999999-9999-9999-9999-999999999999')$$,
  '42501', null,
  '[F0-26][AC-10] a family member of another client cannot add a section'
);
delete from client_custom_info_sections where id = 'c1111111-1111-1111-1111-111111111111';
reset role;
select is(
  (select count(*)::int from client_custom_info_sections where id = 'c1111111-1111-1111-1111-111111111111'),
  1,
  '[F0-26][AC-10] a family member of another client cannot remove a section'
);

-- ---------------------------------------------------------------------------
-- Priya (admin of Margaret's organisation): AAL2 manages; AAL1 gets nothing.
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from client_custom_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  1,
  '[F0-26][AC-10] an AAL2 admin of the organisation reads the sections'
);
select lives_ok(
  $$insert into client_custom_info_sections (id, client_id, title, updated_by)
    values ('c4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'Key contacts', 'a2222222-2222-2222-2222-222222222222')$$,
  '[F0-26][AC-10] an AAL2 admin of the organisation adds a section'
);
update client_custom_info_sections set title = 'Contacts', updated_by = 'a2222222-2222-2222-2222-222222222222'
  where id = 'c4444444-4444-4444-4444-444444444444';
select is(
  (select title from client_custom_info_sections where id = 'c4444444-4444-4444-4444-444444444444'),
  'Contacts',
  '[F0-26][AC-10] an AAL2 admin of the organisation renames a section'
);
delete from client_custom_info_sections where id = 'c4444444-4444-4444-4444-444444444444';
select is(
  (select count(*)::int from client_custom_info_sections where id = 'c4444444-4444-4444-4444-444444444444'),
  0,
  '[F0-26][AC-10] an AAL2 admin of the organisation removes a section'
);
reset role;

select pg_temp.login('a2222222-2222-2222-2222-222222222222', 'aal1');
select is(
  (select count(*)::int from client_custom_info_sections),
  0,
  '[F0-26][AC-10] an admin without AAL2 reads nothing'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'Sneaky', 'a2222222-2222-2222-2222-222222222222')$$,
  '42501', null,
  '[F0-26][AC-10] an admin without AAL2 cannot add a section'
);
reset role;

-- ---------------------------------------------------------------------------
-- Wendy (admin of another organisation): nothing.
-- ---------------------------------------------------------------------------
select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from client_custom_info_sections),
  0,
  '[F0-26][AC-10] another organisation''s admin reads nothing'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title, updated_by)
    values ('b1111111-1111-1111-1111-111111111111', 'Sneaky', 'a4444444-4444-4444-4444-444444444444')$$,
  '42501', null,
  '[F0-26][AC-10] another organisation''s admin cannot add a section'
);
delete from client_custom_info_sections where id = 'c1111111-1111-1111-1111-111111111111';
reset role;
select is(
  (select count(*)::int from client_custom_info_sections where id = 'c1111111-1111-1111-1111-111111111111'),
  1,
  '[F0-26][AC-10] another organisation''s admin cannot remove a section'
);

-- ---------------------------------------------------------------------------
-- Title rules (AC-03) and the limit (AC-08), checked by the database too.
-- ---------------------------------------------------------------------------
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title) values ('b1111111-1111-1111-1111-111111111111', 'COMMUNICATION')$$,
  '23505', null,
  '[F0-26][AC-03] a title already used on the client, in any case, is refused'
);
select lives_ok(
  $$insert into client_custom_info_sections (client_id, title) values ('b2222222-2222-2222-2222-222222222222', 'Communication')$$,
  '[F0-26][AC-03] the same title on another client is fine'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title) values ('b1111111-1111-1111-1111-111111111111', 'Medical History')$$,
  '23514', null,
  '[F0-26][AC-03] a built-in title is refused'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title) values ('b1111111-1111-1111-1111-111111111111', 'documentation')$$,
  '23514', null,
  '[F0-26][AC-03] "Documentation" is refused'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title) values ('b1111111-1111-1111-1111-111111111111', '   ')$$,
  '23514', null,
  '[F0-26][AC-03] a blank title is refused'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title) values ('b1111111-1111-1111-1111-111111111111', ' Padded ')$$,
  '23514', null,
  '[F0-26][AC-03] an untrimmed title is refused'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title) values ('b1111111-1111-1111-1111-111111111111', repeat('x', 61))$$,
  '23514', null,
  '[F0-26][AC-03] a title over 60 characters is refused'
);
select lives_ok(
  $$insert into client_custom_info_sections (client_id, title) values ('b1111111-1111-1111-1111-111111111111', repeat('y', 60))$$,
  '[F0-26][AC-03] a 60-character title is accepted'
);
select throws_ok(
  $$insert into client_custom_info_sections (client_id, title, body) values ('b1111111-1111-1111-1111-111111111111', 'Long', repeat('x', 5001))$$,
  '23514', null,
  '[F0-26][AC-03] text over 5,000 characters is refused'
);

-- Margaret has 2 sections; fill to 20, then the 21st is refused.
insert into client_custom_info_sections (client_id, title)
  select 'b1111111-1111-1111-1111-111111111111', 'Extra ' || n from generate_series(1, 18) as n;
select is(
  (select count(*)::int from client_custom_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
  20,
  '[F0-26][AC-08] a client can have 20 custom sections'
);
select throws_like(
  $$insert into client_custom_info_sections (client_id, title) values ('b1111111-1111-1111-1111-111111111111', 'One too many')$$,
  '%limit%',
  '[F0-26][AC-08] a 21st custom section is refused'
);

-- ---------------------------------------------------------------------------
-- Audit (AC-11): insert, update and delete are captured; the delete keeps the old text.
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from audit_log
    where table_name = 'client_custom_info_sections' and record_id = 'c2222222-2222-2222-2222-222222222222'
      and action in ('INSERT', 'UPDATE', 'DELETE')),
  3,
  '[F0-26][AC-11] adding, editing and removing a section each write an audit row'
);
select is(
  (select (before ->> 'title') || '|' || (before ->> 'body') from audit_log
    where table_name = 'client_custom_info_sections' and record_id = 'c2222222-2222-2222-2222-222222222222'
      and action = 'DELETE'),
  'Behaviour support|Calm voice.',
  '[F0-26][AC-11] the removal''s audit row keeps the old title and text'
);
select is(
  (select actor_id from audit_log
    where table_name = 'client_custom_info_sections' and record_id = 'c2222222-2222-2222-2222-222222222222'
      and action = 'DELETE'),
  'a1111111-1111-1111-1111-111111111111'::uuid,
  '[F0-26][AC-11] the removal''s audit row names who removed it'
);

select * from finish();
rollback;
