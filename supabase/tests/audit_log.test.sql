-- [F0-08] Append-only audit log capture
-- Covers AC-01..AC-03 (docs/development/shared/shared-audit-log-capture/ACCEPTANCE_CRITERIA.md)
begin;
select plan(16);

-- Seed: one organisation
insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care');

-- Seed: auth users backing each profile under test
insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com');

-- Seed: profiles — Helen (family), Priya (admin, Banksia)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Smith', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true);

-- Seed: Margaret (Banksia, Helen's client)
insert into clients (id, organisation_id, first_name, last_name, date_of_birth, suburb) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells', '1945-03-01', 'Carlton');

insert into client_family_members (client_id, profile_id, relationship_label) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Daughter');

-- Impersonation helper: switches to the `authenticated` role with the given user's JWT sub claim
create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- [T-01][AC-01] Helen updates Margaret's client row -> one UPDATE audit row.
-- F0-06 has no UPDATE policy on clients yet, so the write runs as the table owner
-- with Helen's JWT claims set: auth.uid() (what the trigger reads) is still Helen.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
update clients set suburb = 'Fitzroy' where id = 'b1111111-1111-1111-1111-111111111111';

select is(
  (select count(*)::int from audit_log
    where table_name = 'clients' and action = 'UPDATE'
      and record_id = 'b1111111-1111-1111-1111-111111111111'),
  1,
  '[T-01][AC-01] one UPDATE audit row exists for Margaret''s client row'
);
select is(
  (select actor_id from audit_log where table_name = 'clients' and action = 'UPDATE'),
  'a1111111-1111-1111-1111-111111111111'::uuid,
  '[T-01][AC-01] the audit row records Helen as actor_id'
);
select is(
  (select action from audit_log where table_name = 'clients' and action = 'UPDATE'),
  'UPDATE',
  '[T-01][AC-01] the audit row action is UPDATE'
);
select is(
  (select actor_role from audit_log where table_name = 'clients' and action = 'UPDATE'),
  'family',
  '[T-01][AC-01] the audit row records Helen''s role (family) as actor_role'
);
select is(
  (select before ->> 'suburb' from audit_log where table_name = 'clients' and action = 'UPDATE'),
  'Carlton',
  '[T-01][AC-01] the before image holds the old value'
);
select is(
  (select after ->> 'suburb' from audit_log where table_name = 'clients' and action = 'UPDATE'),
  'Fitzroy',
  '[T-01][AC-01] the after image holds the new value'
);
select is(
  (select client_id from audit_log where table_name = 'clients' and action = 'UPDATE'),
  'b1111111-1111-1111-1111-111111111111'::uuid,
  '[T-01][AC-01] client_id scopes the audit row to Margaret'
);

-- ---------------------------------------------------------------------------
-- [T-02][AC-02] no role can UPDATE or DELETE audit_log
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');
select throws_ok(
  $$update audit_log set table_name = 'tampered'$$,
  '42501',
  null,
  '[T-02][AC-02] an authenticated user cannot UPDATE audit_log'
);
select throws_ok(
  $$delete from audit_log$$,
  '42501',
  null,
  '[T-02][AC-02] an authenticated user cannot DELETE from audit_log'
);

-- Supplementary: even the table owner is blocked (append-only for everyone)
set local role postgres;
select throws_ok(
  $$update audit_log set table_name = 'tampered'$$,
  '42501',
  null,
  '[T-02][AC-02] the table owner cannot UPDATE audit_log either'
);
select throws_ok(
  $$delete from audit_log$$,
  '42501',
  null,
  '[T-02][AC-02] the table owner cannot DELETE from audit_log either'
);

-- ---------------------------------------------------------------------------
-- [T-03][AC-03] service-role change -> actor_role 'system', actor_id null
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role service_role;
update clients set suburb = 'Brunswick' where id = 'b1111111-1111-1111-1111-111111111111';
set local role postgres;

select is(
  (select actor_role from audit_log where table_name = 'clients' and action = 'UPDATE' and after ->> 'suburb' = 'Brunswick'),
  'system',
  '[T-03][AC-03] a service-role change records actor_role system'
);
select is(
  (select actor_id from audit_log where table_name = 'clients' and action = 'UPDATE' and after ->> 'suburb' = 'Brunswick'),
  null::uuid,
  '[T-03][AC-03] a service-role change records a null actor_id'
);

-- ---------------------------------------------------------------------------
-- [T-04][AC-01] supplementary: INSERT and DELETE are captured; composite-key
-- tables (no id column) get a null record_id but keep client_id and both images
-- ---------------------------------------------------------------------------
insert into client_info_sections (client_id, key, body) values
  ('b1111111-1111-1111-1111-111111111111', 'habits', 'Tea at 3pm');

select is(
  (select action || ':' || coalesce(record_id::text, 'null') || ':' || coalesce(before::text, 'null')
     from audit_log where table_name = 'client_info_sections'),
  'INSERT:null:null',
  '[T-04][AC-01] an INSERT is captured with a null before image and null record_id for a composite-key table'
);
select is(
  (select client_id from audit_log where table_name = 'client_info_sections'),
  'b1111111-1111-1111-1111-111111111111'::uuid,
  '[T-04][AC-01] a composite-key table row is still scoped by client_id'
);

delete from client_info_sections where client_id = 'b1111111-1111-1111-1111-111111111111' and key = 'habits';

select is(
  (select (before is not null and after is null)::text from audit_log
    where table_name = 'client_info_sections' and action = 'DELETE'),
  'true',
  '[T-04][AC-01] a DELETE is captured with a before image and a null after image'
);

select * from finish();
rollback;
