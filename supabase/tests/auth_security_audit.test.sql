-- [F0-21] Auth security audit
-- AC-01 (T-01, database level): an admin whose session is below AAL2 (password only, or a token
-- with no `aal` claim) reads no admin-scoped row and every admin write is refused, through tables,
-- Storage and SECURITY DEFINER functions alike; the same admin at AAL2 works. Family and carer are
-- never gated (CHG-040), so their AAL1 sessions keep working.
-- AC-03 (T-03, database level): another organisation's admin, another family and another
-- organisation's carer cannot read, insert, update or delete client A's rows on any client-scoped
-- table by naming client A's ids. Includes the shift reassignment gap (a carer from another
-- organisation could be put on a shift by update, which the insert trigger alone did not check).
-- The AAL claim read is `auth.jwt() ->> 'aal'` (non-blocking default, feature DECISIONS.md FD-01).
begin;
select plan(111);

-- ---------------------------------------------------------------------------
-- Fixtures (as the table owner)
-- ---------------------------------------------------------------------------
insert into organisations (id, name) values
  ('f2100000-0000-4000-8000-0000000000a1', 'Org A'),
  ('f2100000-0000-4000-8000-0000000000b1', 'Org B');

insert into auth.users (id, email) values
  ('f2100000-0000-4000-8000-000000000a01', 'f021-admin-a@example.test'),
  ('f2100000-0000-4000-8000-000000000b01', 'f021-admin-b@example.test'),
  ('f2100000-0000-4000-8000-000000000a02', 'f021-carer-a@example.test'),
  ('f2100000-0000-4000-8000-000000000b02', 'f021-carer-b@example.test'),
  ('f2100000-0000-4000-8000-000000000a03', 'f021-family-a@example.test'),
  ('f2100000-0000-4000-8000-000000000b03', 'f021-family-b@example.test');

insert into profiles (id, role, organisation_id, first_name, last_name) values
  ('f2100000-0000-4000-8000-000000000a01', 'admin', 'f2100000-0000-4000-8000-0000000000a1', 'Ada', 'Admin'),
  ('f2100000-0000-4000-8000-000000000b01', 'admin', 'f2100000-0000-4000-8000-0000000000b1', 'Bea', 'Admin'),
  ('f2100000-0000-4000-8000-000000000a02', 'carer', 'f2100000-0000-4000-8000-0000000000a1', 'Cal', 'Carer'),
  ('f2100000-0000-4000-8000-000000000b02', 'carer', 'f2100000-0000-4000-8000-0000000000b1', 'Cy', 'Carer'),
  ('f2100000-0000-4000-8000-000000000a03', 'family', null, 'Fay', 'Family'),
  ('f2100000-0000-4000-8000-000000000b03', 'family', null, 'Fin', 'Family');

insert into clients (id, organisation_id, first_name, last_name) values
  ('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-0000000000a1', 'Clara', 'A'),
  ('f2100000-0000-4000-8000-00000000c0b1', 'f2100000-0000-4000-8000-0000000000b1', 'Colin', 'B');

insert into client_family_members (client_id, profile_id) values
  ('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-000000000a03'),
  ('f2100000-0000-4000-8000-00000000c0b1', 'f2100000-0000-4000-8000-000000000b03');

-- An in-progress shift for each organisation's carer with its own client (also creates notifications).
insert into shifts (id, client_id, carer_id, starts_at, ends_at) values
  ('f2100000-0000-4000-8000-0000005a0a01', 'f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-000000000a02', now() - interval '1 hour', now() + interval '2 hours'),
  ('f2100000-0000-4000-8000-0000005a0b01', 'f2100000-0000-4000-8000-00000000c0b1', 'f2100000-0000-4000-8000-000000000b02', now() - interval '1 hour', now() + interval '2 hours');

insert into client_info_sections (client_id, key, body) values
  ('f2100000-0000-4000-8000-00000000c0a1', 'description', 'A''s description'),
  ('f2100000-0000-4000-8000-00000000c0b1', 'description', 'B''s description');

insert into care_events (id, client_id, title, starts_at, created_by) values
  ('f2100000-0000-4000-8000-0000000e0a01', 'f2100000-0000-4000-8000-00000000c0a1', 'A event', date_trunc('second', now() - interval '1 day'), 'f2100000-0000-4000-8000-000000000a03'),
  ('f2100000-0000-4000-8000-0000000e0b01', 'f2100000-0000-4000-8000-00000000c0b1', 'B event', date_trunc('second', now() - interval '1 day'), 'f2100000-0000-4000-8000-000000000b03');

insert into care_event_overrides (event_id, original_start, kind, new_duration_minutes)
select id, starts_at, 'modified', 15 from care_events where id = 'f2100000-0000-4000-8000-0000000e0a01';

insert into care_event_completions (event_id, client_id, original_start, action, actor_id, actor_display_name)
select id, client_id, starts_at, 'done', 'f2100000-0000-4000-8000-000000000a03', 'Fay Family'
from care_events where id = 'f2100000-0000-4000-8000-0000000e0a01';

insert into budget_buckets (id, client_id, name) values
  ('f2100000-0000-4000-8000-00000000bba1', 'f2100000-0000-4000-8000-00000000c0a1', 'Core');
insert into budget_fund_entries (bucket_id, client_id, kind, amount, recorded_by, recorded_by_name) values
  ('f2100000-0000-4000-8000-00000000bba1', 'f2100000-0000-4000-8000-00000000c0a1', 'bucket_added', 100, 'f2100000-0000-4000-8000-000000000a03', 'Fay Family');
insert into budget_costs (bucket_id, client_id, original_start, description, amount, status, incurred_on, paid_on, recorded_by, recorded_by_name) values
  ('f2100000-0000-4000-8000-00000000bba1', 'f2100000-0000-4000-8000-00000000c0a1', now(), 'Visit', 10, 'paid', current_date, current_date, 'f2100000-0000-4000-8000-000000000a03', 'Fay Family');

insert into documents (id, client_id, storage_path, filename, mime_type, size_bytes, uploaded_by) values
  ('f2100000-0000-4000-8000-0000000d0a01', 'f2100000-0000-4000-8000-00000000c0a1',
   'clients/f2100000-0000-4000-8000-00000000c0a1/f2100000-0000-4000-8000-0000000d0a01/plan.pdf',
   'plan.pdf', 'application/pdf', 10, 'f2100000-0000-4000-8000-000000000a03');
insert into storage.objects (bucket_id, name, owner) values
  ('client-documents', 'clients/f2100000-0000-4000-8000-00000000c0a1/f2100000-0000-4000-8000-0000000d0a01/plan.pdf',
   'f2100000-0000-4000-8000-000000000a03');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- p_aal null: a token with no `aal` claim at all.
create or replace function pg_temp.login(p_user_id uuid, p_aal text) returns void as $$
begin
  reset role;
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims',
    jsonb_strip_nulls(jsonb_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', p_aal))::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- Rows a statement changed, or -1 when it was refused as not permitted (42501: RLS or a grant).
-- A dry run: whatever the statement did is rolled back (the F0021 raise undoes the block), so one
-- attempt never changes what a later test sees.
create or replace function pg_temp.attempt(p_sql text) returns int as $$
declare
  v_rows int := null;
begin
  begin
    execute p_sql;
    get diagnostics v_rows = row_count;
    raise exception 'dry run' using errcode = 'F0021';
  exception
    when insufficient_privilege then
      return -1;
    when sqlstate 'F0021' then
      return v_rows;
  end;
end;
$$ language plpgsql;

-- Tables where a DELETE naming client A's rows removed anything (expected: none).
create or replace function pg_temp.deletable_for_client_a() returns text[] as $$
declare
  v_table text;
  v_where text;
  v_hit text[] := '{}';
  v_rows int;
begin
  for v_table, v_where in
    select * from (values
      ('clients', 'id'), ('client_family_members', 'client_id'), ('client_info_sections', 'client_id'),
      ('shifts', 'client_id'), ('care_events', 'client_id'), ('care_event_overrides', 'client_id'),
      ('care_event_completions', 'client_id'), ('budget_buckets', 'client_id'),
      ('budget_fund_entries', 'client_id'), ('budget_costs', 'client_id'), ('documents', 'client_id'),
      ('carer_notifications', 'client_id')
    ) t(tbl, col)
  loop
    begin
      execute format('delete from %I where %I = %L', v_table, v_where, 'f2100000-0000-4000-8000-00000000c0a1');
      get diagnostics v_rows = row_count;
      if v_rows > 0 then v_hit := v_hit || v_table; end if;
    exception when insufficient_privilege then
      null;
    end;
  end loop;
  begin
    delete from organisations where id = 'f2100000-0000-4000-8000-0000000000a1';
    get diagnostics v_rows = row_count;
    if v_rows > 0 then v_hit := v_hit || 'organisations'::text; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    delete from profiles where id in ('f2100000-0000-4000-8000-000000000a01', 'f2100000-0000-4000-8000-000000000a02', 'f2100000-0000-4000-8000-000000000a03');
    get diagnostics v_rows = row_count;
    if v_rows > 0 then v_hit := v_hit || 'profiles'::text; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    delete from storage.objects where name like 'clients/f2100000-0000-4000-8000-00000000c0a1/%';
    get diagnostics v_rows = row_count;
    if v_rows > 0 then v_hit := v_hit || 'storage.objects'::text; end if;
  exception when insufficient_privilege then null;
  end;
  return v_hit;
end;
$$ language plpgsql;

-- Client A's rows the caller can see, per table (expected: none for an outsider).
create or replace function pg_temp.visible_for_client_a() returns text[] as $$
declare
  v_hit text[] := '{}';
begin
  if exists (select 1 from clients where id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'clients'::text; end if;
  if exists (select 1 from client_family_members where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'client_family_members'::text; end if;
  if exists (select 1 from client_info_sections where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'client_info_sections'::text; end if;
  if exists (select 1 from shifts where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'shifts'::text; end if;
  if exists (select 1 from care_events where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'care_events'::text; end if;
  if exists (select 1 from care_event_overrides where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'care_event_overrides'::text; end if;
  if exists (select 1 from care_event_completions where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'care_event_completions'::text; end if;
  if exists (select 1 from budget_buckets where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'budget_buckets'::text; end if;
  if exists (select 1 from budget_fund_entries where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'budget_fund_entries'::text; end if;
  if exists (select 1 from budget_costs where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'budget_costs'::text; end if;
  if exists (select 1 from documents where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'documents'::text; end if;
  if exists (select 1 from storage.objects where name like 'clients/f2100000-0000-4000-8000-00000000c0a1/%') then v_hit := v_hit || 'storage.objects'::text; end if;
  if exists (select 1 from organisations where id = 'f2100000-0000-4000-8000-0000000000a1') then v_hit := v_hit || 'organisations'::text; end if;
  if exists (select 1 from profiles where id in ('f2100000-0000-4000-8000-000000000a01', 'f2100000-0000-4000-8000-000000000a02', 'f2100000-0000-4000-8000-000000000a03') and id <> auth.uid()) then v_hit := v_hit || 'profiles'::text; end if;
  if exists (select 1 from carer_notifications where client_id = 'f2100000-0000-4000-8000-00000000c0a1') then v_hit := v_hit || 'carer_notifications'::text; end if;
  if exists (select 1 from budget_bucket_summary('f2100000-0000-4000-8000-00000000c0a1')) then v_hit := v_hit || 'budget_bucket_summary'::text; end if;
  return v_hit;
end;
$$ language plpgsql;

-- ===========================================================================
-- AC-01: Ada (admin of Org A) below AAL2
-- ===========================================================================
select pg_temp.login('f2100000-0000-4000-8000-000000000a01', 'aal1');

select is(pg_temp.visible_for_client_a(), '{}'::text[], 'AC-01: an AAL1 admin sees none of her own organisation''s client rows, on any table');
select is((select count(*)::int from profiles), 1, 'AC-01: an AAL1 admin reads only her own profile (the route guard needs it)');
select is((select array_agg(id) from profiles), array['f2100000-0000-4000-8000-000000000a01'::uuid], 'AC-01: ...and that one row is hers');

select is(pg_temp.attempt($$insert into shifts (client_id, carer_id, starts_at, ends_at) values ('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-000000000a02', now() + interval '1 day', now() + interval '1 day 2 hours')$$),
  -1, 'AC-01: an AAL1 admin cannot insert a shift');
select is(pg_temp.attempt($$update shifts set ends_at = ends_at + interval '1 minute' where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$),
  0, 'AC-01: an AAL1 admin cannot update a shift');
select is(pg_temp.attempt($$insert into client_info_sections (client_id, key, body, updated_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'habits', 'x', 'f2100000-0000-4000-8000-000000000a01')$$),
  -1, 'AC-01: an AAL1 admin cannot insert client info');
select is(pg_temp.attempt($$update client_info_sections set body = 'x', updated_by = 'f2100000-0000-4000-8000-000000000a01' where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$),
  0, 'AC-01: an AAL1 admin cannot update client info');
select is(pg_temp.attempt($$insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'clients/f2100000-0000-4000-8000-00000000c0a1/x/aal1.pdf', 'aal1.pdf', 'application/pdf', 1, 'f2100000-0000-4000-8000-000000000a01')$$),
  -1, 'AC-01: an AAL1 admin cannot add a document row');
select is(pg_temp.attempt($$insert into storage.objects (bucket_id, name) values ('client-documents', 'clients/f2100000-0000-4000-8000-00000000c0a1/x/aal1.pdf')$$),
  -1, 'AC-01: an AAL1 admin cannot upload to the client''s Storage folder');
select is(pg_temp.attempt($$update documents set detached_at = now() where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$),
  0, 'AC-01: an AAL1 admin cannot detach a document');
select throws_ok($$select add_bucket('f2100000-0000-4000-8000-00000000c0a1', 'AAL1 attempt', 0)$$, '42501', null, 'AC-01: an AAL1 admin cannot add a bucket');
select throws_ok($$select add_funds('f2100000-0000-4000-8000-00000000bba1', 10)$$, '42501', null, 'AC-01: an AAL1 admin cannot add funds');
select throws_ok($$select remove_funds('f2100000-0000-4000-8000-00000000bba1', 1)$$, '42501', null, 'AC-01: an AAL1 admin cannot remove funds');
select throws_ok($$select set_event_cost('f2100000-0000-4000-8000-0000000e0a01', 5, 'f2100000-0000-4000-8000-00000000bba1')$$, '42501', null, 'AC-01: an AAL1 admin cannot set an event''s cost');
select throws_ok($$select client_shift_carers('f2100000-0000-4000-8000-00000000c0a1', now() - interval '1 day', now() + interval '1 day')$$, '42501', null, 'AC-01: an AAL1 admin cannot list who is on shift');
select throws_ok($$select admin_update_organisation('Hijacked', '54123456789', '03 9555 0102', '1 High St')$$, '42501', null, 'AC-01: an AAL1 admin cannot edit the organisation');
select throws_ok($$select admin_update_staff('f2100000-0000-4000-8000-000000000a02', 'Cal', 'Carer', '0400000000', 'cal@example.test', 'Carer')$$, '42501', null, 'AC-01: an AAL1 admin cannot edit staff');
select throws_ok($$select admin_create_staff_profile(gen_random_uuid(), 'New', 'Carer', '0400000000', 'new@example.test', 'Carer')$$, '42501', null, 'AC-01: an AAL1 admin cannot create a staff profile');
select throws_ok($$select admin_discard_staff_invite(gen_random_uuid())$$, '42501', null, 'AC-01: an AAL1 admin cannot discard an invite');
select is(pg_temp.deletable_for_client_a(), '{}'::text[], 'AC-01: an AAL1 admin deletes nothing');

-- A token with no `aal` claim at all is treated as below AAL2.
select pg_temp.login('f2100000-0000-4000-8000-000000000a01', null);
select is(pg_temp.visible_for_client_a(), '{}'::text[], 'AC-01: an admin token without an aal claim sees nothing');
select throws_ok($$select admin_update_organisation('Hijacked', '54123456789', '03 9555 0102', '1 High St')$$, '42501', null, 'AC-01: an admin token without an aal claim cannot edit the organisation');

-- An unexpected value is not AAL2 either.
select pg_temp.login('f2100000-0000-4000-8000-000000000a01', 'AAL2');
select is(pg_temp.visible_for_client_a(), '{}'::text[], 'AC-01: only the exact claim value aal2 counts');

-- ---------------------------------------------------------------------------
-- AC-01: the same admin at AAL2 works as before
-- ---------------------------------------------------------------------------
select pg_temp.login('f2100000-0000-4000-8000-000000000a01', 'aal2');
select is(
  pg_temp.visible_for_client_a(),
  array['clients', 'client_family_members', 'client_info_sections', 'shifts', 'care_events',
        'care_event_overrides', 'care_event_completions', 'budget_buckets', 'budget_fund_entries',
        'budget_costs', 'documents', 'storage.objects', 'organisations', 'profiles', 'budget_bucket_summary']::text[],
  'AC-01: at AAL2 the admin reads every admin-scoped table for her client (not carer notifications: recipient-only)'
);
select is((select count(*)::int from profiles where id = 'f2100000-0000-4000-8000-000000000a03'), 1, 'AC-01: at AAL2 the admin reads the linked family contact');
select isnt((select id from add_bucket('f2100000-0000-4000-8000-00000000c0a1', 'Respite', 0)), null, 'AC-01: at AAL2 the admin adds a bucket');
select isnt((select id from add_funds('f2100000-0000-4000-8000-00000000bba1', 10)), null, 'AC-01: at AAL2 the admin adds funds');
select is((select name from admin_update_organisation('Org A Renamed', '54123456789', '03 9555 0102', '1 High St')), 'Org A Renamed', 'AC-01: at AAL2 the admin edits the organisation');
select is((select first_name from admin_update_staff('f2100000-0000-4000-8000-000000000a02', 'Callum', 'Carer', '0400000000', 'cal@example.test', 'Carer')), 'Callum', 'AC-01: at AAL2 the admin edits staff');
select is(pg_temp.attempt($$update shifts set ends_at = ends_at + interval '1 minute' where id = 'f2100000-0000-4000-8000-0000005a0a01'$$), 1, 'AC-01: at AAL2 the admin updates a shift');
select is(pg_temp.attempt($$insert into shifts (client_id, carer_id, starts_at, ends_at) values ('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-000000000a02', now() + interval '3 days', now() + interval '3 days 2 hours')$$), 1, 'AC-01: at AAL2 the admin inserts a shift');
select is(pg_temp.attempt($$insert into client_info_sections (client_id, key, body, updated_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'habits', 'Tea at 3', 'f2100000-0000-4000-8000-000000000a01')$$), 1, 'AC-01: at AAL2 the admin writes client info');
select isnt((select count(*) from client_shift_carers('f2100000-0000-4000-8000-00000000c0a1', now() - interval '1 day', now() + interval '1 day')), 0::bigint, 'AC-01: at AAL2 the admin lists who is on shift');

-- ---------------------------------------------------------------------------
-- AC-01: family and carer are never gated (CHG-040): their AAL1 sessions keep working
-- ---------------------------------------------------------------------------
select pg_temp.login('f2100000-0000-4000-8000-000000000a02', 'aal1');
select is((select count(*)::int from clients where id = 'f2100000-0000-4000-8000-00000000c0a1'), 1, 'AC-01: an AAL1 carer on shift still reads the client');
select is((select count(*)::int from profiles where organisation_id = 'f2100000-0000-4000-8000-0000000000a1'), 2, 'AC-01: an AAL1 carer still reads their organisation''s staff profiles (admin and carer)');
select is((select count(*)::int from organisations), 1, 'AC-01: an AAL1 carer still reads their organisation');
select is(pg_temp.attempt($$update client_info_sections set body = 'Carer note', updated_by = 'f2100000-0000-4000-8000-000000000a02' where client_id = 'f2100000-0000-4000-8000-00000000c0a1' and key = 'description'$$), 1, 'AC-01: an AAL1 carer on shift still writes client info');

select pg_temp.login('f2100000-0000-4000-8000-000000000a03', 'aal1');
select is((select count(*)::int from clients where id = 'f2100000-0000-4000-8000-00000000c0a1'), 1, 'AC-01: an AAL1 family member still reads their client');
select isnt((select id from add_funds('f2100000-0000-4000-8000-00000000bba1', 5)), null, 'AC-01: an AAL1 family member still changes the budget');
select is(pg_temp.attempt($$update care_events set title = 'A event (edited)' where id = 'f2100000-0000-4000-8000-0000000e0a01'$$), 1, 'AC-01: an AAL1 family member still edits events');

-- ===========================================================================
-- AC-03: Bea, admin of Org B (AAL2), names Org A's ids
-- ===========================================================================
select pg_temp.login('f2100000-0000-4000-8000-000000000b01', 'aal2');
select is(pg_temp.visible_for_client_a(), '{}'::text[], 'AC-03: another organisation''s admin reads none of client A''s rows on any table');
select is((select count(*)::int from carer_notifications), 0, 'AC-03: an admin reads no carer''s notifications');
select throws_ok($$select count(*) from audit_log$$, '42501', null, 'AC-03: audit_log is unreadable through the API');
select is(pg_temp.attempt($$insert into shifts (client_id, carer_id, starts_at, ends_at) values ('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-000000000a02', now() + interval '1 day', now() + interval '1 day 1 hour')$$), -1, 'AC-03: another admin cannot insert a shift for client A');
select is(pg_temp.attempt($$update shifts set ends_at = now() where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$), 0, 'AC-03: another admin cannot update client A''s shifts');
select is(pg_temp.attempt($$update shifts set client_id = 'f2100000-0000-4000-8000-00000000c0a1' where id = 'f2100000-0000-4000-8000-0000005a0b01'$$), -1, 'AC-03: another admin cannot move their own shift onto client A');
select is(pg_temp.attempt($$insert into client_info_sections (client_id, key, body, updated_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'medical_history', 'x', 'f2100000-0000-4000-8000-000000000b01')$$), -1, 'AC-03: another admin cannot insert client A''s info');
select is(pg_temp.attempt($$update client_info_sections set body = 'x', updated_by = 'f2100000-0000-4000-8000-000000000b01' where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$), 0, 'AC-03: another admin cannot update client A''s info');
select is(pg_temp.attempt($$insert into client_family_members (client_id, profile_id) values ('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-000000000b01')$$), -1, 'AC-03: another admin cannot link themselves to client A');
select is(pg_temp.attempt($$update clients set organisation_id = 'f2100000-0000-4000-8000-0000000000b1' where id = 'f2100000-0000-4000-8000-00000000c0a1'$$), 0, 'AC-03: another admin cannot move client A to their organisation');
select is(pg_temp.attempt($$update profiles set first_name = 'x' where id = 'f2100000-0000-4000-8000-000000000a02'$$), 0, 'AC-03: another admin cannot edit Org A''s carer profile directly');
select is(pg_temp.attempt($$insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'clients/f2100000-0000-4000-8000-00000000c0a1/x/b.pdf', 'b.pdf', 'application/pdf', 1, 'f2100000-0000-4000-8000-000000000b01')$$), -1, 'AC-03: another admin cannot add a document to client A');
select is(pg_temp.attempt($$insert into storage.objects (bucket_id, name) values ('client-documents', 'clients/f2100000-0000-4000-8000-00000000c0a1/x/b.pdf')$$), -1, 'AC-03: another admin cannot upload into client A''s folder');
select is(pg_temp.attempt($$update documents set detached_at = now() where id = 'f2100000-0000-4000-8000-0000000d0a01'$$), 0, 'AC-03: another admin cannot detach client A''s document');
select is(pg_temp.attempt($$update storage.objects set name = name || '.x' where name like 'clients/f2100000-0000-4000-8000-00000000c0a1/%'$$), 0, 'AC-03: another admin cannot rename client A''s stored file');
select throws_ok($$select add_bucket('f2100000-0000-4000-8000-00000000c0a1', 'Mine', 0)$$, '42501', null, 'AC-03: another admin cannot add a bucket to client A');
select throws_ok($$select add_funds('f2100000-0000-4000-8000-00000000bba1', 10)$$, '42501', null, 'AC-03: another admin cannot add funds to client A''s bucket');
select throws_ok($$select remove_funds('f2100000-0000-4000-8000-00000000bba1', 1)$$, '42501', null, 'AC-03: another admin cannot remove client A''s funds');
select throws_ok($$select rename_bucket('f2100000-0000-4000-8000-00000000bba1', 'Mine')$$, '42501', null, 'AC-03: another admin cannot rename client A''s bucket');
select throws_ok($$select remove_bucket('f2100000-0000-4000-8000-00000000bba1')$$, '42501', null, 'AC-03: another admin cannot remove client A''s bucket');
select throws_ok($$select set_event_cost('f2100000-0000-4000-8000-0000000e0a01', 5, 'f2100000-0000-4000-8000-00000000bba1')$$, '42501', null, 'AC-03: another admin cannot set client A''s event cost');
select throws_ok($$select client_shift_carers('f2100000-0000-4000-8000-00000000c0a1', now() - interval '1 day', now() + interval '1 day')$$, '42501', null, 'AC-03: another admin cannot list client A''s carers');
select throws_ok($$select admin_update_staff('f2100000-0000-4000-8000-000000000a02', 'x', 'y', '0400000000', 'x@example.test', 'Carer')$$, '42501', null, 'AC-03: another admin cannot edit Org A''s carer');
select throws_ok($$select set_occurrence_done('f2100000-0000-4000-8000-0000000e0a01', date_trunc('second', now()))$$, '42501', null, 'AC-03: another admin cannot tick off client A''s care');
select throws_ok($$select transfer_client_organisation('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-0000000000b1')$$, '42501', null, 'AC-03: another admin cannot transfer client A');
select is(pg_temp.deletable_for_client_a(), '{}'::text[], 'AC-03: another admin deletes nothing of client A');

-- ===========================================================================
-- AC-03: Fin (family of client B) names client A's ids
-- ===========================================================================
select pg_temp.login('f2100000-0000-4000-8000-000000000b03', 'aal1');
select is(pg_temp.visible_for_client_a(), '{}'::text[], 'AC-03: another family reads none of client A''s rows on any table');
select is(pg_temp.attempt($$insert into care_events (client_id, title, starts_at, created_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'Injected', date_trunc('second', now()), 'f2100000-0000-4000-8000-000000000b03')$$), -1, 'AC-03: another family cannot add an event to client A');
select is(pg_temp.attempt($$update care_events set title = 'x' where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$), 0, 'AC-03: another family cannot edit client A''s events');
select throws_ok($$update care_events set client_id = 'f2100000-0000-4000-8000-00000000c0a1' where id = 'f2100000-0000-4000-8000-0000000e0b01'$$, '22023', null, 'AC-03: another family cannot move their event onto client A (F0-11 trigger)');
select is(pg_temp.attempt($$insert into care_event_overrides (event_id, original_start, kind, created_by) select 'f2100000-0000-4000-8000-0000000e0a01', date_trunc('second', now() + interval '7 days'), 'cancelled', 'f2100000-0000-4000-8000-000000000b03'$$), -1, 'AC-03: another family cannot cancel client A''s occurrence');
select is(pg_temp.attempt($$update care_event_overrides set new_duration_minutes = 1 where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$), 0, 'AC-03: another family cannot edit client A''s overrides');
select is(pg_temp.attempt($$insert into client_info_sections (client_id, key, body) values ('f2100000-0000-4000-8000-00000000c0a1', 'habits', 'x')$$), -1, 'AC-03: another family cannot insert client A''s info');
select is(pg_temp.attempt($$update client_info_sections set body = 'x' where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$), 0, 'AC-03: another family cannot update client A''s info');
select is(pg_temp.attempt($$insert into client_family_members (client_id, profile_id) values ('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-000000000b03')$$), -1, 'AC-03: another family cannot link themselves to client A');
select is(pg_temp.attempt($$update client_family_members set client_id = 'f2100000-0000-4000-8000-00000000c0a1' where profile_id = 'f2100000-0000-4000-8000-000000000b03'$$), 0, 'AC-03: another family cannot re-point their link to client A');
select is(pg_temp.attempt($$update profiles set first_name = 'x' where id = 'f2100000-0000-4000-8000-000000000a03'$$), 0, 'AC-03: another family cannot edit family A''s profile');
select is(pg_temp.attempt($$insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'clients/f2100000-0000-4000-8000-00000000c0a1/x/f.pdf', 'f.pdf', 'application/pdf', 1, 'f2100000-0000-4000-8000-000000000b03')$$), -1, 'AC-03: another family cannot add a document to client A');
select is(pg_temp.attempt($$insert into storage.objects (bucket_id, name) values ('client-documents', 'clients/f2100000-0000-4000-8000-00000000c0a1/x/f.pdf')$$), -1, 'AC-03: another family cannot upload into client A''s folder');
select is(pg_temp.attempt($$update documents set detached_at = now() where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$), 0, 'AC-03: another family cannot detach client A''s document');
select throws_ok($$select add_bucket('f2100000-0000-4000-8000-00000000c0a1', 'Mine', 0)$$, '42501', null, 'AC-03: another family cannot add a bucket to client A');
select throws_ok($$select add_funds('f2100000-0000-4000-8000-00000000bba1', 10)$$, '42501', null, 'AC-03: another family cannot add funds to client A');
select throws_ok($$select remove_funds('f2100000-0000-4000-8000-00000000bba1', 1)$$, '42501', null, 'AC-03: another family cannot remove client A''s funds');
select throws_ok($$select set_event_cost('f2100000-0000-4000-8000-0000000e0a01', 5, 'f2100000-0000-4000-8000-00000000bba1')$$, '42501', null, 'AC-03: another family cannot set client A''s event cost');
select throws_ok($$select set_occurrence_done('f2100000-0000-4000-8000-0000000e0a01', date_trunc('second', now()))$$, '42501', null, 'AC-03: another family cannot tick off client A''s care');
select throws_ok($$select set_occurrence_undone('f2100000-0000-4000-8000-0000000e0a01', (select starts_at from care_events where id = 'f2100000-0000-4000-8000-0000000e0b01'))$$, '42501', null, 'AC-03: another family cannot undo client A''s care');
select throws_ok($$select client_shift_carers('f2100000-0000-4000-8000-00000000c0a1', now() - interval '1 day', now() + interval '1 day')$$, '42501', null, 'AC-03: another family cannot list client A''s carers');
select throws_ok($$select transfer_client_organisation('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-0000000000b1')$$, '42501', null, 'AC-03: another family cannot transfer client A');
select throws_ok($$select * from list_organisations_for_transfer('f2100000-0000-4000-8000-00000000c0a1')$$, '42501', null, 'AC-03: another family cannot list organisations for client A');
select is(pg_temp.deletable_for_client_a(), '{}'::text[], 'AC-03: another family deletes nothing of client A');

-- ===========================================================================
-- AC-03: Cy (carer of Org B, on shift with client B) names client A's ids
-- ===========================================================================
select pg_temp.login('f2100000-0000-4000-8000-000000000b02', 'aal1');
select is(pg_temp.visible_for_client_a(), '{}'::text[], 'AC-03: another organisation''s carer reads none of client A''s rows on any table');
select is((select count(*)::int from get_carer_shifts('f2100000-0000-4000-8000-000000000a02', now() - interval '1 day', now() + interval '1 day')), 0, 'AC-03: a carer cannot read another carer''s shifts by naming their id');
select is(pg_temp.attempt($$update carer_notifications set read_at = now() where recipient_id = 'f2100000-0000-4000-8000-000000000a02'$$), 0, 'AC-03: a carer cannot mark another carer''s notifications read');
select is(pg_temp.attempt($$insert into care_events (client_id, title, starts_at, created_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'Injected', date_trunc('second', now()), 'f2100000-0000-4000-8000-000000000b02')$$), -1, 'AC-03: another carer cannot add an event to client A');
select is(pg_temp.attempt($$update care_events set title = 'x' where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$), 0, 'AC-03: another carer cannot edit client A''s events');
select is(pg_temp.attempt($$insert into client_info_sections (client_id, key, body, updated_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'habits', 'x', 'f2100000-0000-4000-8000-000000000b02')$$), -1, 'AC-03: another carer cannot insert client A''s info');
select is(pg_temp.attempt($$update client_info_sections set body = 'x', updated_by = 'f2100000-0000-4000-8000-000000000b02' where client_id = 'f2100000-0000-4000-8000-00000000c0a1'$$), 0, 'AC-03: another carer cannot update client A''s info');
select is(pg_temp.attempt($$insert into documents (client_id, storage_path, filename, mime_type, size_bytes, uploaded_by) values ('f2100000-0000-4000-8000-00000000c0a1', 'clients/f2100000-0000-4000-8000-00000000c0a1/x/c.pdf', 'c.pdf', 'application/pdf', 1, 'f2100000-0000-4000-8000-000000000b02')$$), -1, 'AC-03: another carer cannot add a document to client A');
select is(pg_temp.attempt($$insert into storage.objects (bucket_id, name) values ('client-documents', 'clients/f2100000-0000-4000-8000-00000000c0a1/x/c.pdf')$$), -1, 'AC-03: another carer cannot upload into client A''s folder');
select throws_ok($$select set_occurrence_done('f2100000-0000-4000-8000-0000000e0a01', date_trunc('second', now()))$$, '42501', null, 'AC-03: another carer cannot tick off client A''s care');
select throws_ok($$select add_funds('f2100000-0000-4000-8000-00000000bba1', 10)$$, '42501', null, 'AC-03: another carer cannot add funds to client A');
select throws_ok($$select client_shift_carers('f2100000-0000-4000-8000-00000000c0a1', now() - interval '1 day', now() + interval '1 day')$$, '42501', null, 'AC-03: another carer cannot list client A''s carers');
select is(pg_temp.deletable_for_client_a(), '{}'::text[], 'AC-03: another carer deletes nothing of client A');

-- ===========================================================================
-- AC-03: swapped ids on a shift update. Ada (Org A, AAL2) tries to put Org B's carer on her
-- client's shift, or relabel the shift as Org B's. The insert trigger (F0-10) checks the carer's
-- organisation only on insert.
-- ===========================================================================
select pg_temp.login('f2100000-0000-4000-8000-000000000a01', 'aal2');
select throws_ok(
  $$update shifts set carer_id = 'f2100000-0000-4000-8000-000000000b02' where id = 'f2100000-0000-4000-8000-0000005a0a01'$$,
  '42501', null,
  'AC-03: an admin cannot reassign a shift to another organisation''s carer'
);
select lives_ok(
  $$update shifts set organisation_id = 'f2100000-0000-4000-8000-0000000000b1' where id = 'f2100000-0000-4000-8000-0000005a0a01'$$,
  'AC-03: relabelling a shift''s organisation is not an error...'
);
reset role;
select is(
  (select organisation_id from shifts where id = 'f2100000-0000-4000-8000-0000005a0a01'),
  'f2100000-0000-4000-8000-0000000000a1'::uuid,
  'AC-03: ...but the organisation is always re-derived from the client, so it stays Org A'
);
select is(
  (select carer_id from shifts where id = 'f2100000-0000-4000-8000-0000005a0a01'),
  'f2100000-0000-4000-8000-000000000a02'::uuid,
  'AC-03: the shift still belongs to Org A''s carer'
);
select is(
  (select count(*)::int from carer_notifications where recipient_id = 'f2100000-0000-4000-8000-000000000b02' and client_id = 'f2100000-0000-4000-8000-00000000c0a1'),
  0,
  'AC-03: Org B''s carer received no notification about client A'
);

-- Reassigning to a carer of the same organisation still works (ADM-07 will rely on it), and a
-- transfer still cancels and ends shifts (the guard looks at carer/client/organisation only).
select pg_temp.login('f2100000-0000-4000-8000-000000000a01', 'aal2');
reset role;
insert into auth.users (id, email) values ('f2100000-0000-4000-8000-000000000a04', 'f021-carer-a2@example.test');
insert into profiles (id, role, organisation_id, first_name, last_name) values
  ('f2100000-0000-4000-8000-000000000a04', 'carer', 'f2100000-0000-4000-8000-0000000000a1', 'Cora', 'Carer');
select pg_temp.login('f2100000-0000-4000-8000-000000000a01', 'aal2');
select is(
  pg_temp.attempt($$update shifts set carer_id = 'f2100000-0000-4000-8000-000000000a04' where id = 'f2100000-0000-4000-8000-0000005a0a01'$$),
  1,
  'AC-03: an admin can still reassign a shift within her organisation'
);
select pg_temp.login('f2100000-0000-4000-8000-000000000a03', 'aal1');
select lives_ok(
  $$select transfer_client_organisation('f2100000-0000-4000-8000-00000000c0a1', 'f2100000-0000-4000-8000-0000000000b1')$$,
  'AC-03: a family transfer still ends the client''s shifts (not blocked by the shift guard)'
);
reset role;
select is(
  (select count(*)::int from shifts where client_id = 'f2100000-0000-4000-8000-00000000c0a1' and cancelled_at is null and ends_at > now()),
  0,
  'AC-03: after the transfer no shift for client A is still running or upcoming'
);

select * from finish();
rollback;
