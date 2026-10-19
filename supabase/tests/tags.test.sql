-- [F0-29] Tags on events and documents: client_tags, care_event_tags, document_tags and the
-- family-only set_event_tags / set_document_tags
-- (docs/development/shared/shared-event-document-tags/ACCEPTANCE_CRITERIA.md).
-- Covers AC-05 (T-03): only a family member of the client may tag; an admin of the client's
-- organisation, an assigned carer, another client's family member and an anonymous caller are
-- refused and nothing changes; nobody writes the tables directly. AC-14's database half: name
-- rules, one tag per name in any case, per-client lists, reads by family, carer and admin only.
begin;
select plan(30);

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
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a9999999-9999-9999-9999-999999999999', 'gary@example.com');

-- Helen (family of Margaret), Priya (admin, Margaret's organisation), Aisha (carer on shift with
-- Margaret now), Wendy (admin, another organisation), Gary (family of Tom only).
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a9999999-9999-9999-9999-999999999999', 'family', null, 'Gary', 'Reid', true);

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter'),
  ('b2222222-2222-2222-2222-222222222222', 'a9999999-9999-9999-9999-999999999999', 'Son');

-- A shift in progress: Aisha is assigned and on shift, so she could edit the event itself.
insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() - interval '1 hour', now() + interval '1 hour');

insert into care_events (id, client_id, title, starts_at) values
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'GP visit', date_trunc('second', now())),
  ('e2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Tom physio', date_trunc('second', now()));

insert into documents (id, client_id, storage_path, filename, mime_type, size_bytes) values
  ('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111/referral.pdf', 'referral.pdf', 'application/pdf', 1000);

create or replace function pg_temp.login(p_user_id uuid, p_aal text default 'aal2') returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

create or replace function pg_temp.event_tags(p_event uuid) returns text as $$
  select coalesce(string_agg(t.name, '|' order by t.name), '')
  from care_event_tags et join client_tags t on t.id = et.tag_id
  where et.event_id = p_event;
$$ language sql security definer;

-- Schema ----------------------------------------------------------------------------------------
select has_table('client_tags', '[F0-29][AC-14] client_tags exists');
select has_table('care_event_tags', '[F0-29][AC-14] care_event_tags exists');
select has_table('document_tags', '[F0-29][AC-14] document_tags exists');
select ok(
  (select bool_and(relrowsecurity) from pg_class
   where relname in ('client_tags', 'care_event_tags', 'document_tags')),
  '[F0-29][AC-05] RLS is on for all three tables'
);
select ok(
  (select bool_and(prosecdef) from pg_proc where proname in ('set_event_tags', 'set_document_tags')),
  '[F0-29][AC-05] both functions are SECURITY DEFINER'
);

-- Family tags -----------------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select set_event_tags('e1111111-1111-1111-1111-111111111111', array['Doctors', '  Medication ']) $$,
  '[F0-29][AC-01] Helen (family) tags Margaret''s event'
);
reset role;
select is(pg_temp.event_tags('e1111111-1111-1111-1111-111111111111'), 'Doctors|Medication',
  '[F0-29][AC-01] the event has both tags, trimmed');
select is(
  (select count(*)::int from client_tags where client_id = 'b1111111-1111-1111-1111-111111111111'),
  2, '[F0-29][AC-01] both names joined Margaret''s list'
);
select is(
  (select actor_id from audit_log where table_name = 'care_event_tags' order by id desc limit 1),
  'a1111111-1111-1111-1111-111111111111'::uuid,
  '[F0-29] the tagging is audited with Helen as the actor'
);

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select set_event_tags('e1111111-1111-1111-1111-111111111111', array['doctors']) $$,
  '[F0-29][AC-02] Helen replaces the tags with "doctors"'
);
reset role;
select is(pg_temp.event_tags('e1111111-1111-1111-1111-111111111111'), 'Doctors',
  '[F0-29][AC-03] "doctors" is the existing "Doctors", and Medication was removed');
select is(
  (select count(*)::int from client_tags where client_id = 'b1111111-1111-1111-1111-111111111111'),
  2, '[F0-29][AC-03] no second "doctors" tag was made; unused tags stay in the list'
);

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select set_document_tags('d1111111-1111-1111-1111-111111111111', array['Doctors', 'Referral']) $$,
  '[F0-29][AC-11] Helen tags Margaret''s document'
);
select is(
  (select string_agg(t.name, '|' order by t.name) from document_tags dt join client_tags t on t.id = dt.tag_id
   where dt.document_id = 'd1111111-1111-1111-1111-111111111111'),
  'Doctors|Referral', '[F0-29][AC-11] Helen reads the document''s tags'
);
select lives_ok(
  $$ select set_event_tags('e1111111-1111-1111-1111-111111111111', array[]::text[]) $$,
  '[F0-29][AC-02] an empty list clears the event''s tags'
);
reset role;
select is(pg_temp.event_tags('e1111111-1111-1111-1111-111111111111'), '',
  '[F0-29][AC-02] the event has no tags');

-- Name rules ------------------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ select set_event_tags('e1111111-1111-1111-1111-111111111111', array[repeat('x', 31)]) $$,
  '22023', null, '[F0-29][AC-03] a name over 30 characters is refused'
);
select throws_ok(
  $$ select set_event_tags('e1111111-1111-1111-1111-111111111111', array['  ']) $$,
  '22023', null, '[F0-29][AC-03] a blank name is refused'
);
select throws_ok(
  $$ select set_event_tags('e1111111-1111-1111-1111-111111111111',
       array['a','b','c','d','e','f','g','h','i','j','k']) $$,
  '22023', null, '[F0-29][AC-03] an 11th tag is refused'
);
reset role;

-- Refused callers -------------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ select set_event_tags('e1111111-1111-1111-1111-111111111111', array['Carer tag']) $$,
  '42501', null, '[F0-29][AC-05] Aisha (carer on shift) is refused'
);
select throws_ok(
  $$ insert into care_event_tags (client_id, event_id, tag_id)
     select client_id, 'e1111111-1111-1111-1111-111111111111', id from client_tags limit 1 $$,
  '42501', null, '[F0-29][AC-05] Aisha cannot insert an event tag directly'
);
reset role;
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ select set_document_tags('d1111111-1111-1111-1111-111111111111', array['Admin tag']) $$,
  '42501', null, '[F0-29][AC-05] Priya (admin of the organisation) is refused'
);
reset role;
select pg_temp.login('a9999999-9999-9999-9999-999999999999');
select throws_ok(
  $$ select set_event_tags('e1111111-1111-1111-1111-111111111111', array['Gary tag']) $$,
  '42501', null, '[F0-29][AC-05] Gary (another client''s family) is refused'
);
select throws_ok(
  $$ insert into client_tags (client_id, name) values ('b1111111-1111-1111-1111-111111111111', 'Gary tag') $$,
  '42501', null, '[F0-29][AC-05] Gary cannot insert a tag directly'
);
reset role;
set local role anon;
select throws_ok(
  $$ select set_event_tags('e1111111-1111-1111-1111-111111111111', array['Anon']) $$,
  '42501', null, '[F0-29][AC-05] an anonymous caller is refused'
);
reset role;
select is(
  (select count(*)::int from client_tags
   where client_id in ('b1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222')),
  3, '[F0-29][AC-05] refused calls added no tags'
);

-- Reads -----------------------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from client_tags), 3, '[F0-29][AC-12] Aisha (assigned carer) reads Margaret''s tags'
);
reset role;
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from document_tags), 2, '[F0-29][AC-14] Priya reads the document tags'
);
reset role;
select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from client_tags), 0, '[F0-29][AC-14] Wendy (another organisation) reads none'
);
reset role;
select pg_temp.login('a9999999-9999-9999-9999-999999999999');
select is(
  (select count(*)::int from client_tags), 0, '[F0-29][AC-14] Gary reads none of Margaret''s tags'
);
reset role;

select * from finish();
rollback;
