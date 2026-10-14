-- [F0-28] Client personal details: the new clients columns, their checks, and
-- save_client_details (docs/development/shared/shared-client-profile-details/ACCEPTANCE_CRITERIA.md).
-- Covers AC-13 (T-04): only a family member of the client may save; an admin of the client's
-- organisation, an assigned carer, another client's family member and an anonymous caller are
-- refused and nothing changes. AC-12's database half: family, the assigned carer and the
-- organisation's admin read the details; another organisation's admin does not. AC-04/AC-09's
-- database half: shape checks. AC-08: null clears. Audit: the save is logged with the caller.
begin;
select plan(27);

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

-- Helen (family of Margaret), Priya (admin, Margaret's organisation), Aisha (carer with an upcoming
-- shift with Margaret), Wendy (admin, another organisation), Gary (family of Tom only).
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'admin', '22222222-2222-2222-2222-222222222222', 'Wendy', 'Cho', true),
  ('a9999999-9999-9999-9999-999999999999', 'family', null, 'Gary', 'Reid', true);

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter'),
  ('b2222222-2222-2222-2222-222222222222', 'a9999999-9999-9999-9999-999999999999', 'Son');

-- An upcoming shift is what makes Aisha Margaret's assigned carer (is_assigned_carer, PD-041).
insert into shifts (client_id, carer_id, organisation_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', now() + interval '1 day', now() + interval '1 day 2 hours');

create or replace function pg_temp.login(p_user_id uuid, p_aal text default 'aal2') returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- Margaret's full set, as Helen would save it.
create or replace function pg_temp.save_full(p_client uuid) returns void as $$
  select save_client_details(
    p_client,
    '1952-03-02'::date,
    'margaret@example.com',
    '0400 111 222',
    '12 Banksia Street',
    'Brunswick',
    'Helen Doyle',
    'Daughter',
    '+61 400 333 444'
  );
$$ language sql;

-- Schema ----------------------------------------------------------------------------------------
select has_column('clients', 'email', '[F0-28][AC-15] clients has email');
select has_column('clients', 'phone', '[F0-28][AC-15] clients has phone');
select has_column('clients', 'address', '[F0-28][AC-15] clients has address');
select has_column('clients', 'emergency_contact_name', '[F0-28][AC-15] clients has emergency_contact_name');
select has_column('clients', 'emergency_contact_relationship', '[F0-28][AC-15] clients has emergency_contact_relationship');
select has_column('clients', 'emergency_contact_phone', '[F0-28][AC-15] clients has emergency_contact_phone');
select ok(
  (select prosecdef from pg_proc where proname = 'save_client_details'),
  '[F0-28][AC-13] save_client_details is SECURITY DEFINER'
);

-- Family saves ----------------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select pg_temp.save_full('b1111111-1111-1111-1111-111111111111') $$,
  '[F0-28][AC-07] Helen (family) saves Margaret''s details'
);
reset role;
select is(
  (select concat_ws('|', date_of_birth, email, phone, address, suburb, emergency_contact_name,
     emergency_contact_relationship, emergency_contact_phone)
   from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  '1952-03-02|margaret@example.com|0400 111 222|12 Banksia Street|Brunswick|Helen Doyle|Daughter|+61 400 333 444',
  '[F0-28][AC-07] every field is stored'
);
select is(
  (select actor_id from audit_log
   where table_name = 'clients' and action = 'UPDATE'
     and record_id = 'b1111111-1111-1111-1111-111111111111'
   order by id desc limit 1),
  'a1111111-1111-1111-1111-111111111111'::uuid,
  '[F0-28] the save is audited with Helen as the actor'
);

-- Blank text is stored as null, and null clears.
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ select save_client_details('b1111111-1111-1111-1111-111111111111', '1952-03-02', '  ', '0400 111 222',
       null, 'Brunswick', null, null, null) $$,
  '[F0-28][AC-08] Helen clears the email, address and emergency contact'
);
reset role;
select is(
  (select concat_ws('|', email is null, address is null, emergency_contact_name is null, phone)
   from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  't|t|t|0400 111 222',
  '[F0-28][AC-08] cleared fields are null; kept fields stay'
);

-- Shape checks ----------------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$ select save_client_details('b1111111-1111-1111-1111-111111111111', (now() + interval '2 days')::date,
       null, null, null, null, null, null, null) $$,
  '23514', null,
  '[F0-28][AC-04] a future date of birth is refused'
);
select throws_ok(
  $$ select save_client_details('b1111111-1111-1111-1111-111111111111', '1899-12-31',
       null, null, null, null, null, null, null) $$,
  '23514', null,
  '[F0-28][AC-04] a date of birth before 1900 is refused'
);
select throws_ok(
  $$ select save_client_details('b1111111-1111-1111-1111-111111111111', null,
       'not-an-email', null, null, null, null, null, null) $$,
  '23514', null,
  '[F0-28][AC-04] a malformed email is refused'
);
select throws_ok(
  $$ select save_client_details('b1111111-1111-1111-1111-111111111111', null,
       null, 'call me', null, null, null, null, null) $$,
  '23514', null,
  '[F0-28][AC-04] a malformed phone is refused'
);
select throws_ok(
  $$ select save_client_details('b1111111-1111-1111-1111-111111111111', null,
       null, null, repeat('x', 201), null, null, null, null) $$,
  '23514', null,
  '[F0-28][AC-04] an address over 200 characters is refused'
);
select throws_ok(
  $$ select save_client_details('b1111111-1111-1111-1111-111111111111', null,
       null, null, null, null, null, null, '12') $$,
  '23514', null,
  '[F0-28][AC-04] a malformed emergency contact phone is refused'
);
reset role;

-- Refused callers -------------------------------------------------------------------------------
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ select pg_temp.save_full('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  '[F0-28][AC-13] Priya (admin of the organisation) is refused'
);
reset role;
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ select pg_temp.save_full('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  '[F0-28][AC-13] Aisha (assigned carer) is refused'
);
reset role;
select pg_temp.login('a9999999-9999-9999-9999-999999999999');
select throws_ok(
  $$ select pg_temp.save_full('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  '[F0-28][AC-13] Gary (another client''s family) is refused'
);
reset role;
set local role anon;
select throws_ok(
  $$ select pg_temp.save_full('b1111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  '[F0-28][AC-13] an anonymous caller is refused'
);
reset role;
select is(
  (select concat_ws('|', email is null, address is null, phone)
   from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  't|t|0400 111 222',
  '[F0-28][AC-13] refused calls changed nothing'
);

-- Reads -----------------------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select is(
  (select phone from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  '0400 111 222', '[F0-28][AC-11] Helen reads the details'
);
reset role;
select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select is(
  (select phone from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  '0400 111 222', '[F0-28][AC-12] Aisha (assigned carer) reads the details'
);
reset role;
select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(
  (select phone from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  '0400 111 222', '[F0-28][AC-12] Priya (admin of the organisation) reads the details'
);
reset role;
select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select is(
  (select count(*)::int from clients where id = 'b1111111-1111-1111-1111-111111111111'),
  0, '[F0-28][AC-12] Wendy (another organisation''s admin) reads nothing'
);
reset role;

select * from finish();
rollback;
