-- [F0-18] Carer view access derived from shifts (PD-041, CHG-027)
-- Covers AC-01 to AC-09 (docs/development/shared/shared-carer-shift-access/ACCEPTANCE_CRITERIA.md)
-- for the redefined `is_assigned_carer()`. Time is controlled by placing shifts relative to
-- `now()`, per the worked example (a 09:00–15:00 shift): a shift starting in one hour stands
-- in for "08:00 before a 09:00 shift", one already in progress for "09:00 to 15:00", and so on.
begin;
select plan(17);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care');

-- Margaret (this carer's only client with an upcoming/past/cancelled shift) and Nell
-- (a different client, for AC-07).
insert into clients (id, organisation_id, first_name, last_name) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells'),
  ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Nell', 'Ford');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'aisha@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'deactivated@example.com');

insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a2222222-2222-2222-2222-222222222222', 'carer', '11111111-1111-1111-1111-111111111111', 'Deactivated', 'Carer', false);

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- AC-01, AC-02, AC-03, AC-04: one shift, four points in time relative to it.
-- ---------------------------------------------------------------------------
insert into shifts (id, client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('d0000001-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() + interval '1 hour', now() + interval '7 hours');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select ok(
  is_assigned_carer('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-01] 08:00, before the 09:00 shift: Aisha can already read Margaret'
);
select ok(
  not carer_on_active_shift('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-01] ...but cannot edit yet (unchanged: F0-10)'
);
reset role;

update shifts set starts_at = now() - interval '2 hours', ends_at = now() + interval '4 hours'
where id = 'd0000001-0000-0000-0000-000000000001';

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select ok(
  is_assigned_carer('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-02] during the shift (09:00 to 15:00): Aisha can read Margaret'
);
select ok(
  carer_on_active_shift('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-02] ...and can edit too'
);
reset role;

-- AC-03: the shift has ended, but a later one with the same client exists.
update shifts set starts_at = now() - interval '7 hours', ends_at = now() - interval '1 hour'
where id = 'd0000001-0000-0000-0000-000000000001';
insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() + interval '1 day', now() + interval '1 day 4 hours');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select ok(
  is_assigned_carer('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-03] 15:00 or after, with a later shift booked: Aisha can still read Margaret'
);
select ok(
  not carer_on_active_shift('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-03] ...but cannot edit (the ended shift is over, the later one hasn''t started)'
);
reset role;

-- AC-04: remove the later shift — now nothing of hers with Margaret ends in the future.
delete from shifts where client_id = 'b1111111-1111-1111-1111-111111111111' and starts_at > now();

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select ok(
  not is_assigned_carer('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-04] 15:00 or after, no later shift: Aisha can no longer read Margaret'
);
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  '[F0-18][AC-04] ...clients confirms it: zero rows'
);
select is(
  (select count(*)::int from care_events where client_id = 'b1111111-1111-1111-1111-111111111111'),
  0,
  '[F0-18][AC-04] ...and so does care_events: zero rows'
);
reset role;

-- ---------------------------------------------------------------------------
-- AC-05: a shift scheduled weeks ahead grants read access immediately.
-- ---------------------------------------------------------------------------
insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() + interval '3 weeks', now() + interval '3 weeks 4 hours');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select ok(
  is_assigned_carer('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-05] a shift scheduled three weeks out already gives read access'
);
reset role;

-- ---------------------------------------------------------------------------
-- AC-06: a cancelled shift gives no access; neither does a deactivated carer with a live one.
-- ---------------------------------------------------------------------------
update shifts set cancelled_at = now()
where client_id = 'b1111111-1111-1111-1111-111111111111' and carer_id = 'a1111111-1111-1111-1111-111111111111';

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select ok(
  not is_assigned_carer('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-06] Aisha''s only shift with Margaret is cancelled: no read access'
);
reset role;

insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', now() - interval '1 hour', now() + interval '1 hour');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select ok(
  not is_assigned_carer('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-06] a deactivated carer with a shift in progress still has no read access'
);
reset role;

-- ---------------------------------------------------------------------------
-- AC-07: a shift with a different client gives no access to this one.
-- ---------------------------------------------------------------------------
insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now() - interval '1 hour', now() + interval '1 hour');

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select ok(
  is_assigned_carer('b2222222-2222-2222-2222-222222222222'),
  '[F0-18][AC-07] ...Aisha can read Nell, who she does have a live shift with'
);
select ok(
  not is_assigned_carer('b1111111-1111-1111-1111-111111111111'),
  '[F0-18][AC-07] ...but a shift with Nell gives no access to Margaret'
);
reset role;

-- ---------------------------------------------------------------------------
-- AC-08: transferring the client cancels/ends the carer's shifts, which ends read access.
-- transfer_client_organisation() itself is FAM-13's; this just confirms the read-access
-- side effect through the redefined is_assigned_carer, from Nell's live shift with Aisha.
-- ---------------------------------------------------------------------------
insert into organisations (id, name) values ('22222222-2222-2222-2222-222222222222', 'Wattle Care');
insert into auth.users (id, email) values ('a3333333-3333-3333-3333-333333333333', 'family@example.com');
insert into profiles (id, role, first_name, last_name) values
  ('a3333333-3333-3333-3333-333333333333', 'family', 'Rosa', 'Doyle');
insert into client_family_members (client_id, profile_id) values
  ('b2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select lives_ok(
  $$ select transfer_client_organisation('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222') $$,
  '[F0-18][AC-08] Rosa transfers Nell to Wattle Care'
);
reset role;

select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select ok(
  not is_assigned_carer('b2222222-2222-2222-2222-222222222222'),
  '[F0-18][AC-08] the old organisation''s carer (Aisha) loses read access: her live shift with Nell was ended by the transfer'
);
reset role;

-- ---------------------------------------------------------------------------
-- AC-09: the table is gone.
-- ---------------------------------------------------------------------------
select is(
  to_regclass('public.carer_client_assignments'),
  null,
  '[F0-18][AC-09] carer_client_assignments no longer exists'
);

select * from finish();
rollback;
