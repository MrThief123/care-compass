-- [FAM-11] Family — Update funds (Edit budget)
-- Covers AC-01 to AC-06 (docs/development/family-dev/family-budget-update-funds/ACCEPTANCE_CRITERIA.md) for
-- save_budget_edit(client, buckets, added, note): one transaction applying a whole Edit budget save.
-- Rules under test: PD-034 + PD-058 (family and the client's admins, never a carer), PD-059 (open buckets, one
-- note per save, a wrong field refuses the whole save), PD-060 (a top-up pays pending costs whole, oldest
-- first; the note and the recorder are kept on every row).
begin;
select plan(60);

insert into organisations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Banksia Home Care'),
  ('22222222-2222-2222-2222-222222222222', 'Wattle Care');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'helen@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'priya@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'aisha@example.com'),
  ('a4444444-4444-4444-4444-444444444444', 'dan@example.com'),
  ('a5555555-5555-5555-5555-555555555555', 'rosa@example.com'),
  ('a6666666-6666-6666-6666-666666666666', 'omar@example.com');

-- Helen (family, Margaret), Priya (admin, Banksia), Aisha (carer on a shift with Margaret),
-- Dan (carer, Banksia, no shift), Rosa (family, Robert), Omar (admin, Wattle)
insert into profiles (id, role, organisation_id, first_name, last_name, is_active) values
  ('a1111111-1111-1111-1111-111111111111', 'family', null, 'Helen', 'Doyle', true),
  ('a2222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nair', true),
  ('a3333333-3333-3333-3333-333333333333', 'carer', '11111111-1111-1111-1111-111111111111', 'Aisha', 'Rahman', true),
  ('a4444444-4444-4444-4444-444444444444', 'carer', '11111111-1111-1111-1111-111111111111', 'Dan', 'Wu', true),
  ('a5555555-5555-5555-5555-555555555555', 'family', null, 'Rosa', 'Doyle', true),
  ('a6666666-6666-6666-6666-666666666666', 'admin', '22222222-2222-2222-2222-222222222222', 'Omar', 'Said', true);

insert into clients (id, organisation_id, first_name, last_name, date_of_birth) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Margaret', 'Wells', '1945-03-01'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Robert', 'Doyle', '1950-05-05');

insert into client_family_members (client_id, profile_id) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('b2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555');

insert into shifts (client_id, carer_id, starts_at, ends_at) values
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', now() - interval '1 hour', now() + interval '1 hour');

create or replace function pg_temp.login(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

create or replace function pg_temp.bid(p_n int) returns uuid as $$
  select ('c0000000-0000-0000-0000-' || lpad(p_n::text, 12, '0'))::uuid;
$$ language sql;

-- One Margaret (or given client) bucket as the table owner: funds added, and one paid cost.
create or replace function pg_temp.seed_bucket(p_n int, p_name text, p_funds numeric, p_paid numeric, p_client uuid default 'b1111111-1111-1111-1111-111111111111') returns void as $$
begin
  insert into budget_buckets (id, client_id, name) values (pg_temp.bid(p_n), p_client, p_name);
  if p_funds > 0 then
    insert into budget_fund_entries (bucket_id, client_id, kind, amount, recorded_by, recorded_by_name)
    values (pg_temp.bid(p_n), p_client, 'funds_added', p_funds, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');
  end if;
  if p_paid > 0 then
    insert into budget_costs (bucket_id, client_id, description, amount, status, original_start, incurred_on, paid_on, recorded_by, recorded_by_name)
    values (pg_temp.bid(p_n), p_client, 'Seeded cost', p_paid, 'paid', '2026-01-05 09:00:00+11', budget_today(), budget_today(), 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');
  end if;
end;
$$ language plpgsql;

create or replace function pg_temp.seed_pending(p_n int, p_amount numeric, p_day text) returns void as $$
begin
  insert into budget_costs (bucket_id, client_id, description, amount, status, original_start, incurred_on, recorded_by, recorded_by_name)
  values (pg_temp.bid(p_n), 'b1111111-1111-1111-1111-111111111111', 'Pending ' || p_day, p_amount, 'pending', (p_day || ' 09:00:00+11')::timestamptz, p_day::date, 'a1111111-1111-1111-1111-111111111111', 'Helen Doyle');
end;
$$ language plpgsql;

-- Runs one statement and reports 'ok', or '<sqlstate>|<field path in detail>|<message>' when it is refused.
-- The block is a subtransaction, so a refused statement leaves nothing behind either way.
create or replace function pg_temp.refusal(p_sql text) returns text as $$
declare
  v_detail text;
  v_message text;
begin
  execute p_sql;
  return 'ok';
exception when others then
  get stacked diagnostics v_detail = pg_exception_detail, v_message = message_text;
  return sqlstate || '|' || coalesce(v_detail, '') || '|' || v_message;
end;
$$ language plpgsql;

-- The save, as one call: client Margaret, rows of {id, name, direction, amount, remove}, rows of {name, starting_amount}.
create or replace function pg_temp.save(p_buckets jsonb, p_added jsonb default '[]', p_note text default null, p_client uuid default 'b1111111-1111-1111-1111-111111111111') returns text as $$
  select pg_temp.refusal(format('select save_budget_edit(%L, %L::jsonb, %L::jsonb, %L)', p_client, p_buckets, p_added, p_note));
$$ language sql;

create or replace function pg_temp.row(p_n int, p_name text, p_direction text, p_amount numeric, p_remove boolean default false) returns jsonb as $$
  select jsonb_build_object('id', pg_temp.bid(p_n), 'name', p_name, 'direction', p_direction, 'amount', p_amount, 'remove', p_remove);
$$ language sql;

select pg_temp.seed_bucket(1, 'NDIS', 14880, 0);          -- remaining $14,880
select pg_temp.seed_bucket(2, 'Fixed', 2750, 0);
select pg_temp.seed_bucket(3, 'Government', 3000, 2760);  -- remaining $240 with a $310 pending cost
select pg_temp.seed_pending(3, 310, '2026-01-01');
select pg_temp.seed_bucket(4, 'Spent', 100, 40);          -- money spent: cannot be removed
select pg_temp.seed_bucket(5, 'Unspent', 50, 0);          -- can be removed, $50 left in it
select pg_temp.seed_bucket(6, 'Gift', 0, 0);              -- renamed in the mixed save
select pg_temp.seed_bucket(7, 'Temp', 0, 0);              -- removed and its name reused in one save
select pg_temp.seed_bucket(8, 'Gov2', 3000, 2760);        -- remaining $240, a $310 pending cost
select pg_temp.seed_pending(8, 310, '2026-01-01');
select pg_temp.seed_bucket(9, 'Queue', 0, 0);             -- pending $40, $10, $30 oldest first
select pg_temp.seed_pending(9, 40, '2026-01-01');
select pg_temp.seed_pending(9, 10, '2026-01-02');
select pg_temp.seed_pending(9, 30, '2026-01-03');
select pg_temp.seed_bucket(10, 'Robert bucket', 500, 0, 'b2222222-2222-2222-2222-222222222222');

-- ---------------------------------------------------------------------------
-- AC-01: a top-up shows in the totals and as a History row
-- ---------------------------------------------------------------------------
select pg_temp.login('a1111111-1111-1111-1111-111111111111');

select is(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 1000))), 'ok', '[FAM-11][AC-01] Helen adds $1,000 to NDIS in one save');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'NDIS'), 15880.00::numeric,
  '[FAM-11][AC-01] NDIS remaining is $15,880');
select is((select count(*) from budget_fund_entries where bucket_id = pg_temp.bid(1) and kind = 'funds_added' and amount = 1000), 1::bigint,
  '[FAM-11][AC-01] one "funds_added" row of +$1,000 is recorded');
select is((select entry_date from budget_fund_entries where bucket_id = pg_temp.bid(1) and amount = 1000), budget_today(),
  '[FAM-11][AC-01] dated today in Melbourne, there is no date field');
select is((select recorded_by_name from budget_fund_entries where bucket_id = pg_temp.bid(1) and amount = 1000), 'Helen Doyle',
  '[FAM-11][AC-01] the recorder is the signed-in person');

select is((select count(*) from budget_fund_entries where client_id = 'b1111111-1111-1111-1111-111111111111'), 7::bigint, '[FAM-11] baseline: 6 seeded rows plus the top-up');
select is(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 0), pg_temp.row(2, 'Fixed', 'remove', 0))), 'ok',
  '[FAM-11][AC-01] rows with no amount, no rename and no removal are accepted');
select is((select count(*) from budget_fund_entries where client_id = 'b1111111-1111-1111-1111-111111111111'), 7::bigint, '[FAM-11][AC-01] and write nothing');
select is(pg_temp.save('[]'::jsonb), 'ok', '[FAM-11][AC-01] an empty save is accepted and writes nothing');

-- ---------------------------------------------------------------------------
-- AC-02: each wrong field is refused, saying which field
-- ---------------------------------------------------------------------------
select is(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', -50))), '22023|buckets.0.amount|' || 'enter an amount more than $0, with at most 2 decimal places',
  '[FAM-11][AC-02] -50 is refused on buckets.0.amount');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 12.345))), '22023|buckets.0.amount|%', '[FAM-11][AC-02] 3 decimal places are refused');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 10000000000))), '22023|buckets.0.amount|%', '[FAM-11][AC-02] an amount of $10,000,000,000 is refused');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(3, 'Government', 'remove', 300))), '22023|buckets.0.amount|Only $240.00 available', '[FAM-11][AC-02] removing $300 from $240 says "Only $240.00 available"');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 1), pg_temp.row(2, '', 'add', 0))), '22023|buckets.1.name|%', '[FAM-11][AC-02] an empty name is refused on buckets.1.name');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(2, repeat('x', 41), 'add', 0))), '22023|buckets.0.name|%', '[FAM-11][AC-02] a name of 41 characters is refused');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(2, ' ndis ', 'add', 0))), '23505|buckets.0.name|%', '[FAM-11][AC-02] a rename to another bucket''s name, ignoring case and spaces, is refused');
select alike(pg_temp.save('[]'::jsonb, '[{"name": "", "starting_amount": 5}]'), '22023|added.0.name|%', '[FAM-11][AC-02] a new bucket with no name is refused on added.0.name');
select alike(pg_temp.save('[]'::jsonb, '[{"name": "Grant", "starting_amount": -1}]'), '22023|added.0.startingAmount|%', '[FAM-11][AC-02] a negative starting amount is refused on added.0.startingAmount');
select alike(pg_temp.save('[]'::jsonb, '[{"name": "Grant", "starting_amount": null}]'), '22023|added.0.startingAmount|%', '[FAM-11][AC-02] a missing starting amount is refused');
select alike(pg_temp.save('[]'::jsonb, '[{"name": "ndis", "starting_amount": 5}]'), '23505|added.0.name|%', '[FAM-11][AC-02] a new bucket named like an existing one is refused');
select alike(pg_temp.save('[]'::jsonb, '[{"name": "Twin", "starting_amount": 5}, {"name": "TWIN", "starting_amount": 5}]'), '23505|added.1.name|%', '[FAM-11][AC-02] two new buckets with the same name are refused on the second');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(4, 'Spent', 'add', 0, true))), '22023|buckets.0.remove|%', '[FAM-11][AC-02] a bucket with money spent cannot be removed');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(3, 'Government', 'add', 0, true))), '22023|buckets.0.remove|%', '[FAM-11][AC-02] nor one with a pending cost');
select alike(pg_temp.save(jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'name', 'Ghost', 'direction', 'add', 'amount', 1, 'remove', false))), '42501%',
  '[FAM-11][AC-02] a bucket that is not this client''s is refused as not permitted, saying nothing about it');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(10, 'Robert bucket', 'add', 1))), '42501%', '[FAM-11][AC-02] nor one of another client''s buckets');

-- ---------------------------------------------------------------------------
-- AC-04: one wrong field refuses the whole save
-- ---------------------------------------------------------------------------
select is(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 100), pg_temp.row(5, 'Renamed', 'add', 5), pg_temp.row(2, 'Fixed', 'add', -1)),
  '[{"name": "Fresh", "starting_amount": 10}]', 'whole'), '22023|buckets.2.amount|enter an amount more than $0, with at most 2 decimal places',
  '[FAM-11][AC-04] a valid top-up, a rename and a new bucket beside one wrong amount: refused, naming the wrong one');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'NDIS'), 15880.00::numeric, '[FAM-11][AC-04] the top-up was not kept');
select is((select name from budget_buckets where id = pg_temp.bid(5)), 'Unspent', '[FAM-11][AC-04] the rename was not kept');
select is((select count(*) from budget_buckets where name = 'Fresh'), 0::bigint, '[FAM-11][AC-04] the new bucket was not kept');
select is((select count(*) from budget_fund_entries where client_id = 'b1111111-1111-1111-1111-111111111111'), 7::bigint, '[FAM-11][AC-04] no History row was added');

-- ---------------------------------------------------------------------------
-- AC-05: a mixed save, with a note, a recorder, and names freed within it
-- ---------------------------------------------------------------------------
select is(pg_temp.save(
  jsonb_build_array(
    pg_temp.row(2, 'Fixed', 'add', 500),
    pg_temp.row(3, 'Government', 'remove', 40),
    pg_temp.row(6, 'Gift fund', 'add', 0),
    pg_temp.row(5, 'Unspent', 'add', 0, true)),
  '[{"name": "Council grant", "starting_amount": 1200}]', '  Q3 plan review  '), 'ok',
  '[FAM-11][AC-05] add, remove, rename, add a bucket and remove a bucket, with a note, in one save');
select is((select string_agg(kind || ':' || amount, ',' order by kind) from budget_fund_entries where note = 'Q3 plan review'),
  'bucket_added:1200.00,bucket_removed:-50.00,funds_added:500.00,funds_removed:-40.00',
  '[FAM-11][AC-05] four rows carry the trimmed note, the signs and the money left in the removed bucket');
select is((select count(distinct recorded_by_name) from budget_fund_entries where note = 'Q3 plan review'), 1::bigint, '[FAM-11][AC-05] one recorder for the save');
select is((select min(recorded_by_name) from budget_fund_entries where note = 'Q3 plan review'), 'Helen Doyle', '[FAM-11][AC-05] and it is the signed-in person');
select is((select name from budget_buckets where id = pg_temp.bid(6)), 'Gift fund', '[FAM-11][AC-05] the bucket is renamed');
select is((select count(*) from budget_fund_entries where bucket_id = pg_temp.bid(6)), 0::bigint, '[FAM-11][AC-05] a rename adds no History row');
select is((select removed_at is not null from budget_buckets where id = pg_temp.bid(5)), true, '[FAM-11][AC-05] the unspent bucket is removed');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'Council grant'), 1200.00::numeric, '[FAM-11][AC-05] the new bucket starts at $1,200');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'Fixed'), 3250.00::numeric, '[FAM-11][AC-05] Fixed went from $2,750 to $3,250');

select is(pg_temp.save(jsonb_build_array(pg_temp.row(7, 'Temp', 'add', 0, true)), '[{"name": "temp", "starting_amount": 5}]'), 'ok',
  '[FAM-11][AC-05] a name freed by a removal can be used again in the same save');
select is(pg_temp.save(jsonb_build_array(pg_temp.row(2, 'Fixed support', 'add', 0)), '[{"name": "Fixed", "starting_amount": 0}]'), 'ok',
  '[FAM-11][AC-05] a name freed by a rename can be used again in the same save');
select is((select count(*) from budget_buckets where client_id = 'b1111111-1111-1111-1111-111111111111' and removed_at is null and lower(name) in ('temp', 'fixed')), 2::bigint,
  '[FAM-11][AC-05] both reused names exist once each');

-- ---------------------------------------------------------------------------
-- AC-06: a top-up pays pending costs whole, oldest first
-- ---------------------------------------------------------------------------
select is(pg_temp.save(jsonb_build_array(pg_temp.row(8, 'Gov2', 'add', 50))), 'ok', '[FAM-11][AC-06] a $50 top-up on $240 with a $310 pending cost');
select is((select count(*) from budget_costs where bucket_id = pg_temp.bid(8) and status = 'pending'), 1::bigint, '[FAM-11][AC-06] pays nothing: $290 cannot cover $310');
select is(pg_temp.save(jsonb_build_array(pg_temp.row(3, 'Government', 'add', 150))), 'ok', '[FAM-11][AC-06] a $150 top-up on Government');
select is((select count(*) from budget_costs where bucket_id = pg_temp.bid(3) and status = 'pending'), 0::bigint, '[FAM-11][AC-06] pays the $310 pending cost');
select is((select paid_on from budget_costs where bucket_id = pg_temp.bid(3) and amount = 310), budget_today(), '[FAM-11][AC-06] recording today as the day it was paid');
select is((select remaining from budget_bucket_summary('b1111111-1111-1111-1111-111111111111') where name = 'Government'), 40.00::numeric,
  '[FAM-11][AC-06] and remaining is $40 ($240 - $40 removed + $150 - $310)');
select is(pg_temp.save(jsonb_build_array(pg_temp.row(9, 'Queue', 'add', 50))), 'ok', '[FAM-11][AC-06] $50 on a bucket with pending $40, $10, $30');
select is((select string_agg(amount::text || ':' || status, ',' order by incurred_on) from budget_costs where bucket_id = pg_temp.bid(9)), '40.00:paid,10.00:paid,30.00:pending',
  '[FAM-11][AC-06] pays $40 then $10, strictly oldest first, and stops at the $30 it cannot cover');

-- ---------------------------------------------------------------------------
-- AC-03: who may save
-- ---------------------------------------------------------------------------
reset role;
select is((select count(*) from budget_fund_entries where client_id = 'b1111111-1111-1111-1111-111111111111'), 17::bigint, '[FAM-11] baseline before the permission checks');

select pg_temp.login('a3333333-3333-3333-3333-333333333333');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 5))), '42501%', '[FAM-11][AC-03] a carer assigned to the client is refused');
select pg_temp.login('a4444444-4444-4444-4444-444444444444');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 5))), '42501%', '[FAM-11][AC-03] a carer not assigned is refused');
select pg_temp.login('a5555555-5555-5555-5555-555555555555');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 5))), '42501%', '[FAM-11][AC-03] the family of another client is refused');
select pg_temp.login('a6666666-6666-6666-6666-666666666666');
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 5))), '42501%', '[FAM-11][AC-03] an admin of another organisation is refused');
select alike(pg_temp.save('[]'::jsonb, '[{"name": "Sneaky", "starting_amount": 5}]'), '42501%', '[FAM-11][AC-03] and cannot add a bucket either');
reset role;
set local role anon;
select alike(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 5))), '42501%', '[FAM-11][AC-03] a signed-out caller is refused');
reset role;
select is((select count(*) from budget_fund_entries where client_id = 'b1111111-1111-1111-1111-111111111111'), 17::bigint, '[FAM-11][AC-03] nothing changed');

select pg_temp.login('a2222222-2222-2222-2222-222222222222');
select is(pg_temp.save(jsonb_build_array(pg_temp.row(1, 'NDIS', 'add', 5)), '[]', 'admin top-up'), 'ok', '[FAM-11][AC-03] an admin of the client''s organisation is accepted');
select is((select recorded_by_name from budget_fund_entries where bucket_id = pg_temp.bid(1) and note = 'admin top-up'), 'Priya Nair', '[FAM-11][AC-03] and is named as the recorder');

select * from finish();
rollback;
