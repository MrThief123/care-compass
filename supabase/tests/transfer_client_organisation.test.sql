-- [FAM-13] Family — Change organisation
-- Covers AC-01, AC-02, AC-03 and AC-06 (docs/development/family-dev/family-change-organisation/ACCEPTANCE_CRITERIA.md)
-- for transfer_client_organisation(), plus list_organisations_for_transfer() for the picker.
begin;
select plan(26);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'wendy@example.com'),
  ('a6666666-6666-6666-6666-666666666666', 'rosa@example.com');

-- Helen (family, Margaret), Priya (admin, Banksia), Aisha (carer, Banksia),
-- Wendy (admin, Wattle), Rosa (family, Robert only)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a6666666-6666-6666-6666-666666666666', 'family', null, 'Rosa', 'Doyle', true);

-- Margaret and Nell at Banksia, Robert at Wattle
insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells', '1945-03-01'),
  ('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Nell', 'Ford', '1938-01-01'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Robert', 'Doyle', '1950-05-05');

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter'),
  ('b2222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666', 'Daughter');

-- Records that must survive a transfer unchanged
insert into client_info_sections (client_id, key, body) values
  ('b1111111-1111-1111-1111-111111111111', 'description', 'Margaret likes tea.'),
  ('b1111111-1111-1111-1111-111111111111', 'habits', 'Walks at 9.');

-- Aisha: an active assignment to Margaret and one to Nell
insert into carer_client_assignments (id, carer_id, client_id, organisation_id, started_at, ended_at) values
  ('c1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() - interval '2 hours', null),
  ('c3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() - interval '2 hours', null);

-- Margaret's shifts: 3 in the future, 1 in progress, 1 finished, 1 already cancelled (future); Nell: 1 in the future
insert into shifts (id, client_id, carer_id, starts_at, ends_at, cancelled_at) values
  ('d0000001-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null),
  ('d0000001-0000-0000-0000-000000000002', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '2 days', now() + interval '2 days 4 hours', null),
  ('d0000001-0000-0000-0000-000000000003', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '3 days', now() + interval '3 days 4 hours', null),
  ('d0000001-0000-0000-0000-000000000004', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour', null),
  ('d0000001-0000-0000-0000-000000000005', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '2 days', now() - interval '2 days' + interval '4 hours', null),
  ('d0000001-0000-0000-0000-000000000006', 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() + interval '4 days', now() + interval '4 days 4 hours', now() - interval '1 day'),
  ('d0000003-0000-0000-0000-000000000001', 'b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', now() + interval '1 day', now() + interval '1 day 4 hours', null);

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- Before anything changes, remember the counts AC-03 compares against.
create temp table before_counts as
select
  (select count(*) from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111') as info_sections,
  (select count(*) from client_family_members where client_id = 'b1111111-1111-1111-1111-111111111111') as family_links,
  (select count(*) from shifts where client_id = 'b1111111-1111-1111-1111-111111111111') as shifts,
  (select count(*) from carer_client_assignments where client_id = 'b1111111-1111-1111-1111-111111111111') as assignments;
grant select on before_counts to authenticated;

-- ---------------------------------------------------------------------------
-- Permission (AC-06): nobody but a family member of the client can transfer.
-- ---------------------------------------------------------------------------
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'AC-06: Aisha (carer) calling the function is refused'
);

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'AC-06: Priya (admin of the client''s organisation) calling the function is refused'
);

select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select throws_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'AC-06: Rosa (family of another client) calling the function for Margaret is refused'
);

reset role;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'AC-06: a caller with no session is refused'
);
reset role;

select is(
  (select organisation_id from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'AC-06: the refused calls changed nothing'
);

-- ---------------------------------------------------------------------------
-- Bad input by the right person changes nothing.
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999') $$,
  'P0002', null,
  'an organisation that does not exist is refused'
);
select throws_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111') $$,
  '22023', null,
  'moving a client to the organisation she is already with is refused'
);
select throws_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', null) $$,
  '22023', null,
  'a null organisation is refused'
);

reset role;
select is(
  (select count(*)::int from shifts where client_id = 'b1111111-1111-1111-1111-111111111111' and cancelled_at is not null),
  1,
  'refused calls cancelled no shift (only the one already cancelled)'
);

-- ---------------------------------------------------------------------------
-- The picker's list: family of the client only, current organisation flagged.
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select results_eq(
  $$ select id, name, is_current from list_organisations_for_transfer('b1111111-1111-1111-1111-111111111111') order by name $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid, 'Banksia Home Care'::text, true),
            ('22222222-2222-2222-2222-222222222222'::uuid, 'Wattle Care'::text, false) $$,
  'Helen sees every organisation, with Banksia marked as Margaret''s current one'
);

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ select * from list_organisations_for_transfer('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'Aisha (carer) cannot list organisations for a transfer'
);

-- ---------------------------------------------------------------------------
-- AC-01: Helen transfers Margaret to Wattle Care.
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  'AC-01: Helen transfers Margaret to Wattle Care'
);

reset role;
select is(
  (select organisation_id from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'AC-01: clients.organisation_id changed'
);

select is(
  (select count(*)::int from shifts where client_id = 'b1111111-1111-1111-1111-111111111111' and starts_at > now() and cancelled_at is null),
  0,
  'AC-01: no future shift is left uncancelled'
);

select is(
  (select count(*)::int from shifts where id in ('d0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000003') and cancelled_at is not null),
  3,
  'AC-01: the three future shifts are cancelled'
);

select is(
  (select count(*)::int from carer_client_assignments where client_id = 'b1111111-1111-1111-1111-111111111111' and (ended_at is null or ended_at > now())),
  0,
  'AC-01: the active assignment is ended'
);

select results_eq(
  $$ select cancelled_at is null, ends_at = now() from shifts where id = 'd0000001-0000-0000-0000-000000000004' $$,
  $$ values (true, true) $$,
  'the in-progress shift is ended now, not cancelled'
);

select results_eq(
  $$ select cancelled_at is null, ends_at < now() from shifts where id = 'd0000001-0000-0000-0000-000000000005' $$,
  $$ values (true, true) $$,
  'a finished shift is left as it was'
);

select ok(
  (select cancelled_at < now() - interval '23 hours' from shifts where id = 'd0000001-0000-0000-0000-000000000006'),
  'an already-cancelled shift keeps the time it was cancelled at, not now'
);

select is(
  (select count(*)::int from shifts where client_id = 'b3333333-3333-3333-3333-333333333333' and cancelled_at is null)
  + (select count(*)::int from carer_client_assignments where client_id = 'b3333333-3333-3333-3333-333333333333' and ended_at is null),
  2,
  'another client (Nell) at Banksia keeps her shift and assignment'
);

-- ---------------------------------------------------------------------------
-- AC-02: the outgoing organisation loses access at once; the new one gains it.
-- ---------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  'AC-02: Priya (Banksia admin) selecting Margaret returns zero rows'
);

select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  1,
  'Wendy (Wattle admin) now sees Margaret'
);

-- ---------------------------------------------------------------------------
-- AC-03: nothing that belongs to Margaret is lost.
-- ---------------------------------------------------------------------------
reset role;
select results_eq(
  $$ select
       (select count(*) from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111'),
       (select count(*) from client_family_members where client_id = 'b1111111-1111-1111-1111-111111111111'),
       (select count(*) from shifts where client_id = 'b1111111-1111-1111-1111-111111111111'),
       (select count(*) from carer_client_assignments where client_id = 'b1111111-1111-1111-1111-111111111111') $$,
  $$ select info_sections, family_links, shifts, assignments from before_counts $$,
  'AC-03: information sections, family links, shifts and assignments are all still there'
);

select is(
  (select organisation_id from carer_client_assignments where id = 'c1111111-1111-1111-1111-111111111111'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'AC-03: the ended assignment still names the organisation that made it (history is kept)'
);

-- ---------------------------------------------------------------------------
-- Audit: the change is captured with Helen as the actor.
-- ---------------------------------------------------------------------------
select results_eq(
  $$ select actor_id, actor_role, (before ->> 'organisation_id')::uuid, (after ->> 'organisation_id')::uuid
       from audit_log
      where table_name = 'clients' and action = 'UPDATE' and record_id = 'b1111111-1111-1111-1111-111111111111'
      order by id desc limit 1 $$,
  $$ values ('a1111111-1111-1111-1111-111111111111'::uuid, 'family'::text,
             '11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid) $$,
  'the transfer is in the audit log: Helen, family, Banksia to Wattle'
);

-- ---------------------------------------------------------------------------
-- Once moved, Helen cannot repeat it into the same organisation.
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ select transfer_client_organisation('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  '22023', null,
  'repeating the transfer is refused'
);

select * from finish();
rollback;
