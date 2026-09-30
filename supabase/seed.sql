-- F0-16: Development seed data from the design content
--
-- Loaded by `supabase db reset` (supabase/config.toml [db.seed]) into a LOCAL database only.
-- Synthetic people and figures only (CLAUDE.md §12). Every user has the local-only password
-- `care-compass-local-1!` (docs/SEED_DATA.md). Content matches the Figma designs at the reference
-- date Monday 30 November 2026 (Australia/Melbourne).
--
-- Deterministic: fixed UUIDs for every key row, md5-derived UUIDs for the rest, a fixed password
-- salt, explicit timestamps. `supabase db reset` therefore yields the same data each run.
--
-- Guarded: refuses to run against a database that already holds an organisation or an auth user,
-- so it can never add rows to a live database. It is also never run by `supabase db push`.
--
-- Seeded as the table owner with triggers off (session_replication_role = replica), so the audit
-- log, the cost-charging trigger and the shift trigger do not run: audit_log starts empty, the
-- ledger holds exactly the figures below, and organisation_id on shifts is given explicitly.

do $$
begin
  if exists (select 1 from public.organisations) or exists (select 1 from auth.users) then
    raise exception 'F0-16 seed refused: this database already has an organisation or a user. It only seeds an empty local database (supabase db reset).';
  end if;
end;
$$;

set session_replication_role = replica;

-- ---------------------------------------------------------------------------
-- Organisations
-- ---------------------------------------------------------------------------
insert into public.organisations (id, name, abn, phone, address, created_at) values
  ('a0000000-0000-4000-8000-000000000001', 'Banksia Home Care', '54 123 456 789', '03 9555 0102', '220 High St, Preston VIC 3072', '2026-09-01T09:00:00+10:00'),
  -- A second organisation, so tests can prove one organisation never reads another's data.
  ('a0000000-0000-4000-8000-000000000002', 'Kookaburra Care', '61 987 654 321', '03 9555 0177', '8 Station Rd, Ringwood VIC 3134', '2026-09-01T09:00:00+10:00');

-- ---------------------------------------------------------------------------
-- Users (auth.users + auth.identities) and profiles
-- ---------------------------------------------------------------------------
create temporary table seed_users (
  id uuid primary key,
  email text not null,
  role public.app_role not null,
  organisation_id uuid,
  first_name text not null,
  last_name text not null,
  phone text,
  address text,
  job_title text
) on commit drop;

insert into seed_users values
  -- Banksia Home Care: admin
  ('10000000-0000-4000-8000-000000000001', 'priya.iyer@banksiahomecare.example', 'admin', 'a0000000-0000-4000-8000-000000000001', 'Priya', 'Iyer', null, null, 'Organisation Admin'),
  -- Banksia Home Care: carers
  ('10000000-0000-4000-8000-000000000101', 'aisha.r@banksiahomecare.com.au', 'carer', 'a0000000-0000-4000-8000-000000000001', 'Aisha', 'Rahman', '0423 987 654', null, 'Registered Nurse'),
  ('10000000-0000-4000-8000-000000000102', 'daniel.k@banksiahomecare.example', 'carer', 'a0000000-0000-4000-8000-000000000001', 'Daniel', 'K.', null, null, 'Registered Nurse'),
  ('10000000-0000-4000-8000-000000000103', 'sarah.nguyen@banksiahomecare.example', 'carer', 'a0000000-0000-4000-8000-000000000001', 'Sarah', 'Nguyen', null, null, 'Enrolled Nurse'),
  ('10000000-0000-4000-8000-000000000104', 'marcus.chen@banksiahomecare.example', 'carer', 'a0000000-0000-4000-8000-000000000001', 'Marcus', 'Chen', null, null, 'Support Worker'),
  ('10000000-0000-4000-8000-000000000105', 'fatima.ali@banksiahomecare.example', 'carer', 'a0000000-0000-4000-8000-000000000001', 'Fatima', 'Ali', null, null, 'Support Worker'),
  -- Family (no organisation of their own, as a self-registered family account)
  ('10000000-0000-4000-8000-000000000011', 'helen.doyle@example.com', 'family', null, 'Helen', 'Doyle', '0412 345 678', '12 Wattle St, Preston VIC 3072', null),
  ('10000000-0000-4000-8000-000000000012', 'michael.hale@example.com', 'family', null, 'Michael', 'Hale', null, null, null),
  ('10000000-0000-4000-8000-000000000013', 'susan.marsh@example.com', 'family', null, 'Susan', 'Marsh', null, null, null),
  ('10000000-0000-4000-8000-000000000014', 'karen.novak@example.com', 'family', null, 'Karen', 'Novak', null, null, null),
  ('10000000-0000-4000-8000-000000000015', 'tom.petrov@example.com', 'family', null, 'Tom', 'Petrov', null, null, null),
  -- Kookaburra Care: an admin, a carer and one family, for negative tests
  ('10000000-0000-4000-8000-000000000201', 'owen.patel@kookaburracare.example', 'admin', 'a0000000-0000-4000-8000-000000000002', 'Owen', 'Patel', null, null, 'Organisation Admin'),
  ('10000000-0000-4000-8000-000000000202', 'grace.liu@kookaburracare.example', 'carer', 'a0000000-0000-4000-8000-000000000002', 'Grace', 'Liu', null, null, 'Registered Nurse'),
  ('10000000-0000-4000-8000-000000000203', 'rita.simmons@example.com', 'family', null, 'Rita', 'Simmons', null, null, null);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  -- Fixed salt so the hash, and so the whole reset, is identical each run.
  extensions.crypt('care-compass-local-1!', '$2a$10$CareCompassLocalSalt01'),
  '2026-09-01T09:00:00+10:00',
  '{"provider": "email", "providers": ["email"]}'::jsonb, '{}'::jsonb,
  '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00',
  '', '', '', ''
from seed_users u;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  u.id, u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00'
from seed_users u;

insert into public.profiles (id, role, organisation_id, first_name, last_name, phone, email, address, job_title, is_active)
select id, role, organisation_id, first_name, last_name, phone, email, address, job_title, true
from seed_users;

-- ---------------------------------------------------------------------------
-- Clients and their family
-- ---------------------------------------------------------------------------
-- Ages on 30 Nov 2026: Margaret 78, Robert 82, Elsie 90, Frank 76, Doris 85, Harold 79, Jean 88.
insert into public.clients (id, organisation_id, first_name, last_name, date_of_birth, suburb, created_at, updated_at) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Margaret', 'Doyle', '1948-04-12', 'Preston VIC', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Robert', 'Hale', '1944-03-18', 'Reservoir VIC', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Elsie', 'Marsh', '1936-07-22', 'Thornbury VIC', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Frank', 'Novak', '1950-01-09', 'Northcote VIC', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Doris', 'Petrov', '1941-09-30', 'Preston VIC', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'Harold', 'Byrne', '1947-05-14', 'Coburg VIC', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'Jean', 'Ahmed', '1938-11-02', 'Fairfield VIC', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00'),
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000002', 'Walter', 'Simmons', '1945-02-20', 'Ringwood VIC', '2026-09-01T09:00:00+10:00', '2026-09-01T09:00:00+10:00');

-- Harold and Jean have no family account in the design.
insert into public.client_family_members (client_id, profile_id, relationship_label) values
  ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000011', 'Daughter'),
  ('c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000012', 'Son'),
  ('c0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000013', 'Daughter'),
  ('c0000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000014', 'Daughter'),
  ('c0000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000015', 'Son'),
  ('c0000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000203', 'Wife');

-- A carer's access to a client comes from their shifts (F0-18, PD-041): there is no assignment table.

-- ---------------------------------------------------------------------------
-- Margaret's information sections (design text, word for word)
-- ---------------------------------------------------------------------------
insert into public.client_info_sections (client_id, key, body, updated_by, updated_at) values
  ('c0000000-0000-4000-8000-000000000001', 'description',
   'Margaret lives independently with regular support from Banksia Home Care. She uses a walking frame for mobility outside the home and prefers morning appointments.',
   '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00'),
  ('c0000000-0000-4000-8000-000000000001', 'habits',
   'Enjoys gardening and radio in the afternoon. Prefers tea over coffee. Sleeps 9pm–7am — morning routine should not be rushed.',
   '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00'),
  ('c0000000-0000-4000-8000-000000000001', 'medical_history',
   'Type 2 diabetes (diagnosed 2019), mild osteoarthritis. Known allergy: penicillin. See attached care plan for full medication schedule.',
   '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00');

-- ---------------------------------------------------------------------------
-- Budgets
-- ---------------------------------------------------------------------------
-- Design totals: NDIS $24,000 / $9,120 used, Fixed $5,000 / $2,250, Government $3,000 / $2,760.
-- The design's fund history is partial (three top-ups), so each bucket also has an opening
-- balance entry that makes the total agree: 18,000 + 6,000; 4,000 + 1,000; 2,250 + 750.
insert into public.budget_buckets (id, client_id, name, kind, created_by, created_at, updated_at) values
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'NDIS', 'ndis', '10000000-0000-4000-8000-000000000011', '2026-07-01T09:00:00+10:00', '2026-07-01T09:00:00+10:00'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Fixed', 'fixed', '10000000-0000-4000-8000-000000000011', '2026-07-01T09:00:01+10:00', '2026-07-01T09:00:01+10:00'),
  ('b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'Government', 'government', '10000000-0000-4000-8000-000000000011', '2026-07-01T09:00:02+10:00', '2026-07-01T09:00:02+10:00'),
  ('b0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', 'NDIS', 'ndis', '10000000-0000-4000-8000-000000000012', '2026-07-01T09:00:00+10:00', '2026-07-01T09:00:00+10:00'),
  ('b0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000002', 'Fixed', 'fixed', '10000000-0000-4000-8000-000000000012', '2026-07-01T09:00:01+10:00', '2026-07-01T09:00:01+10:00'),
  ('b0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000002', 'Government', 'government', '10000000-0000-4000-8000-000000000012', '2026-07-01T09:00:02+10:00', '2026-07-01T09:00:02+10:00');

insert into public.budget_fund_entries (id, bucket_id, client_id, kind, amount, description, note, recorded_by, recorded_by_name, entry_date, created_at) values
  -- Margaret: opening balances, then the design's fund history
  (md5('fund:margaret:ndis-open')::uuid, 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'bucket_added', 18000.00, 'Opening balance', 'Opening balance so totals match the design', '10000000-0000-4000-8000-000000000011', 'Helen Doyle', '2026-07-01', '2026-07-01T09:00:00+10:00'),
  (md5('fund:margaret:fixed-open')::uuid, 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'bucket_added', 4000.00, 'Opening balance', 'Opening balance so totals match the design', '10000000-0000-4000-8000-000000000011', 'Helen Doyle', '2026-07-01', '2026-07-01T09:00:01+10:00'),
  (md5('fund:margaret:gov-open')::uuid, 'b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'bucket_added', 2250.00, 'Opening balance', 'Opening balance so totals match the design', '10000000-0000-4000-8000-000000000011', 'Helen Doyle', '2026-07-01', '2026-07-01T09:00:02+10:00'),
  (md5('fund:margaret:gov-topup')::uuid, 'b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'funds_added', 750.00, 'Government subsidy payment', null, '10000000-0000-4000-8000-000000000011', 'Helen Doyle', '2026-10-01', '2026-10-01T10:00:00+10:00'),
  (md5('fund:margaret:fixed-topup')::uuid, 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'funds_added', 1000.00, 'Fixed funding top-up', null, '10000000-0000-4000-8000-000000000011', 'Helen Doyle', '2026-10-15', '2026-10-15T10:00:00+11:00'),
  (md5('fund:margaret:ndis-topup')::uuid, 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'funds_added', 6000.00, 'NDIS quarterly plan top-up', null, '10000000-0000-4000-8000-000000000011', 'Helen Doyle', '2026-11-03', '2026-11-03T10:00:00+11:00'),
  -- Robert (a second client, for tests that must not see Margaret's money)
  (md5('fund:robert:ndis-open')::uuid, 'b0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', 'bucket_added', 13500.00, 'Opening balance', 'Opening balance so totals match the design', '10000000-0000-4000-8000-000000000012', 'Michael Hale', '2026-07-01', '2026-07-01T09:00:00+10:00'),
  (md5('fund:robert:fixed-open')::uuid, 'b0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000002', 'bucket_added', 4000.00, 'Opening balance', 'Opening balance so totals match the design', '10000000-0000-4000-8000-000000000012', 'Michael Hale', '2026-07-01', '2026-07-01T09:00:01+10:00'),
  (md5('fund:robert:gov-open')::uuid, 'b0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000002', 'bucket_added', 2500.00, 'Opening balance', 'Opening balance so totals match the design', '10000000-0000-4000-8000-000000000012', 'Michael Hale', '2026-07-01', '2026-07-01T09:00:02+10:00'),
  (md5('fund:robert:ndis-topup')::uuid, 'b0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', 'funds_added', 4500.00, 'NDIS quarterly plan top-up', null, '10000000-0000-4000-8000-000000000012', 'Michael Hale', '2026-10-20', '2026-10-20T09:30:00+11:00');

-- Costs already paid: they add up to the design's "used" figures. Seeded with no event, so the
-- events below stay uncharged until someone completes them.
insert into public.budget_costs (id, bucket_id, client_id, event_id, original_start, description, amount, status, incurred_on, paid_on, recorded_by, recorded_by_name, created_at)
select md5('cost:' || c.n)::uuid, c.bucket::uuid, c.client::uuid, null,
       c.on_date::timestamptz + interval '10 hours', c.description, c.amount, 'paid', c.on_date, c.on_date,
       who.actor, who.actor_name, c.on_date::timestamptz + interval '10 hours'
from (values
  -- Margaret NDIS: 9,120
  ('m-ndis-1', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-10-06', 'Physiotherapy', 90.00),
  ('m-ndis-2', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-10-13', 'Physiotherapy', 90.00),
  ('m-ndis-3', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-10-20', 'Physiotherapy', 90.00),
  ('m-ndis-4', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-10-27', 'Physiotherapy', 90.00),
  ('m-ndis-5', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-11-03', 'Physiotherapy', 90.00),
  ('m-ndis-6', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-11-10', 'Physiotherapy', 90.00),
  ('m-ndis-7', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-11-17', 'Physiotherapy', 90.00),
  ('m-ndis-8', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-11-24', 'Physiotherapy', 90.00),
  ('m-ndis-9', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-10-09', 'Occupational therapy assessment', 1200.00),
  ('m-ndis-10', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-10-31', 'Support worker hours (October)', 4800.00),
  ('m-ndis-11', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-11-05', 'Continence supplies', 1400.00),
  ('m-ndis-12', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-11-12', 'Home modification: grab rails', 1000.00),
  -- Margaret Fixed: 2,250
  ('m-fix-1', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', date '2026-10-16', 'Podiatry visit', 180.00),
  ('m-fix-2', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', date '2026-10-23', 'Pharmacy: dose administration aids', 620.00),
  ('m-fix-3', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', date '2026-11-06', 'Community transport', 950.00),
  ('m-fix-4', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', date '2026-11-20', 'Meal delivery', 500.00),
  -- Margaret Government: 2,760
  ('m-gov-1', 'b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', date '2026-10-14', 'Respite care', 1200.00),
  ('m-gov-2', 'b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', date '2026-11-02', 'Home care package fee', 900.00),
  ('m-gov-3', 'b0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', date '2026-11-18', 'Medical aids rental', 660.00),
  -- Robert: NDIS 18,000 / 4,000 used; Fixed 4,000 / 1,200; Government 2,500 / 500
  ('r-ndis-1', 'b0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', date '2026-11-10', 'Support worker hours', 4000.00),
  ('r-fix-1', 'b0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000002', date '2026-11-11', 'Community transport', 1200.00),
  ('r-gov-1', 'b0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000002', date '2026-11-12', 'Respite care', 500.00)
) as c (n, bucket, client, on_date, description, amount)
cross join lateral (
  select case when c.client = 'c0000000-0000-4000-8000-000000000001' then '10000000-0000-4000-8000-000000000011'::uuid else '10000000-0000-4000-8000-000000000012'::uuid end as actor,
         case when c.client = 'c0000000-0000-4000-8000-000000000001' then 'Helen Doyle' else 'Michael Hale' end as actor_name
) who;

-- ---------------------------------------------------------------------------
-- Care events
-- ---------------------------------------------------------------------------
-- Each event starts on its first occurrence in the design week (Thu 26 to Mon 30 Nov 2026), so
-- the only Overdue occurrences are the two the designs draw: Weekly weigh-in and Medication
-- review. Recurrence is only {frequency, interval} (src/lib/recurrence), so "Mon, Fri" for
-- Physiotherapy is weekly from Monday; see DECISIONS.md FD-02.
insert into public.care_events (id, client_id, title, description, starts_at, duration_minutes, recurrence, completion_mode, created_by, created_at, updated_at, cost, bucket_id) values
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Morning medication',
   'Administer morning medication as per the current care plan. Confirm with Margaret before administering and record any side effects.',
   '2026-11-27T09:00:00+11:00', 60, '{"frequency": "daily", "interval": 1}', 'manual', '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00', '2026-09-01T10:00:00+10:00', null, null),
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Evening medication',
   'Administer evening medication as per the current care plan and record the time given.',
   '2026-11-29T18:00:00+11:00', 30, '{"frequency": "daily", "interval": 1}', 'manual', '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00', '2026-09-01T10:00:00+10:00', null, null),
  -- Each session costs $90, paid from NDIS (the design's Physiotherapy cost).
  ('e0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'Physiotherapy',
   'Mobility and strength session with the physiotherapist. Focus on balance exercises per the current care plan.',
   '2026-11-30T11:30:00+11:00', 90, '{"frequency": "weekly", "interval": 1}', 'manual', '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00', '2026-09-01T10:00:00+10:00', 90.00, 'b0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000001', 'Afternoon check-in',
   'Check in with Margaret, offer a drink and a snack, and note how she is feeling.',
   '2026-11-30T15:00:00+11:00', 60, '{"frequency": "daily", "interval": 1}', 'manual', '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00', '2026-09-01T10:00:00+10:00', null, null),
  ('e0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000001', 'Weekly weigh-in',
   'Weigh Margaret on the bathroom scales and record the reading in the care log.',
   '2026-11-29T09:30:00+11:00', 15, '{"frequency": "weekly", "interval": 1}', 'manual', '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00', '2026-09-01T10:00:00+10:00', null, null),
  ('e0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000001', 'Medication review',
   'Review current medications against the care plan and note any changes to raise with the GP.',
   '2026-11-28T14:00:00+11:00', 30, '{"frequency": "weekly", "interval": 2}', 'manual', '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00', '2026-09-01T10:00:00+10:00', null, null),
  ('e0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000001', 'Wound dressing check',
   'Check the dressing on the left shin, change it if damp or loose, and note the condition of the wound.',
   '2026-11-26T10:00:00+11:00', 30, '{"frequency": "weekly", "interval": 1}', 'manual', '10000000-0000-4000-8000-000000000011', '2026-09-01T10:00:00+10:00', '2026-09-01T10:00:00+10:00', null, null),
  -- Robert, for tests that must not see Margaret's events
  ('e0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', 'Morning medication',
   'Administer morning medication as per the current care plan.',
   '2026-11-29T08:30:00+11:00', 30, '{"frequency": "daily", "interval": 1}', 'manual', '10000000-0000-4000-8000-000000000012', '2026-09-01T10:00:00+10:00', '2026-09-01T10:00:00+10:00', null, null),
  ('e0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000002', 'Blood pressure check',
   'Take Robert''s blood pressure seated and record the reading.',
   '2026-11-30T10:00:00+11:00', 15, '{"frequency": "weekly", "interval": 1}', 'manual', '10000000-0000-4000-8000-000000000012', '2026-09-01T10:00:00+10:00', '2026-09-01T10:00:00+10:00', null, null);

-- Completions (append-only). Done rows carry who did it and when, as the Family Home, Task log
-- and Admin Home designs show. Nothing else is written: Overdue and Planned are derived.
insert into public.care_event_completions (event_id, client_id, original_start, action, actor_id, actor_display_name, organisation_id, occurred_at) values
  -- Margaret: Wound dressing check Thu 26 Nov
  ('e0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000001', '2026-11-26T10:00:00+11:00', 'done', '10000000-0000-4000-8000-000000000101', 'Aisha Rahman', 'a0000000-0000-4000-8000-000000000001', '2026-11-26T10:20:00+11:00'),
  -- Morning medication Fri 27, Sat 28, Sun 29, Mon 30 Nov
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '2026-11-27T09:00:00+11:00', 'done', '10000000-0000-4000-8000-000000000101', 'Aisha Rahman', 'a0000000-0000-4000-8000-000000000001', '2026-11-27T09:11:00+11:00'),
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '2026-11-28T09:00:00+11:00', 'done', '10000000-0000-4000-8000-000000000105', 'Fatima Ali', 'a0000000-0000-4000-8000-000000000001', '2026-11-28T09:09:00+11:00'),
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '2026-11-29T09:00:00+11:00', 'done', '10000000-0000-4000-8000-000000000104', 'Marcus Chen', 'a0000000-0000-4000-8000-000000000001', '2026-11-29T09:06:00+11:00'),
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '2026-11-30T09:00:00+11:00', 'done', '10000000-0000-4000-8000-000000000101', 'Aisha Rahman', 'a0000000-0000-4000-8000-000000000001', '2026-11-30T09:14:00+11:00'),
  -- Evening medication Sun 29 Nov
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', '2026-11-29T18:00:00+11:00', 'done', '10000000-0000-4000-8000-000000000101', 'Aisha Rahman', 'a0000000-0000-4000-8000-000000000001', '2026-11-29T18:07:00+11:00'),
  -- Robert: Morning medication Sun 29 (Marcus) and Mon 30 Nov (Daniel)
  ('e0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', '2026-11-29T08:30:00+11:00', 'done', '10000000-0000-4000-8000-000000000104', 'Marcus Chen', 'a0000000-0000-4000-8000-000000000001', '2026-11-29T08:39:00+11:00'),
  ('e0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', '2026-11-30T08:30:00+11:00', 'done', '10000000-0000-4000-8000-000000000102', 'Daniel K.', 'a0000000-0000-4000-8000-000000000001', '2026-11-30T08:41:00+11:00');

-- ---------------------------------------------------------------------------
-- Shifts
-- ---------------------------------------------------------------------------
-- Aisha's Mon 30 Nov shifts with Margaret are the ones each Margaret occurrence's nurse is drawn
-- from; 11:30 to 13:00 is the shift the admin conflict warning overlaps.
insert into public.shifts (id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by, created_at)
select md5('shift:' || s.n)::uuid, 'a0000000-0000-4000-8000-000000000001',
       ('c0000000-0000-4000-8000-000000000' || s.client)::uuid,
       ('10000000-0000-4000-8000-000000000' || s.carer)::uuid,
       s.starts_at::timestamptz, s.ends_at::timestamptz,
       '10000000-0000-4000-8000-000000000001', '2026-11-25T09:00:00+11:00'
from (values
  ('a-m-1', '001', '101', '2026-11-26T10:00:00+11:00', '2026-11-26T11:00:00+11:00'),
  ('a-m-2', '001', '101', '2026-11-27T08:30:00+11:00', '2026-11-27T09:30:00+11:00'),
  ('a-m-3', '001', '101', '2026-11-29T17:30:00+11:00', '2026-11-29T19:00:00+11:00'),
  ('a-m-4', '001', '101', '2026-11-30T08:00:00+11:00', '2026-11-30T10:00:00+11:00'),
  ('a-m-5', '001', '101', '2026-11-30T11:30:00+11:00', '2026-11-30T13:00:00+11:00'),
  ('a-m-6', '001', '101', '2026-11-30T14:30:00+11:00', '2026-11-30T16:00:00+11:00'),
  ('a-m-7', '001', '101', '2026-12-01T09:00:00+11:00', '2026-12-01T11:00:00+11:00'),
  ('a-m-8', '001', '101', '2026-12-02T13:00:00+11:00', '2026-12-02T17:00:00+11:00'),
  -- One future shift with each of the design's other six patients (none on Mon 30 Nov)
  ('a-r-1', '002', '101', '2026-12-01T13:00:00+11:00', '2026-12-01T15:00:00+11:00'),
  ('a-e-1', '003', '101', '2026-12-02T09:00:00+11:00', '2026-12-02T11:00:00+11:00'),
  ('a-f-1', '004', '101', '2026-12-03T09:00:00+11:00', '2026-12-03T11:00:00+11:00'),
  ('a-d-1', '005', '101', '2026-12-03T13:00:00+11:00', '2026-12-03T15:00:00+11:00'),
  ('a-h-1', '006', '101', '2026-12-04T09:00:00+11:00', '2026-12-04T11:00:00+11:00'),
  ('a-j-1', '007', '101', '2026-12-04T13:00:00+11:00', '2026-12-04T15:00:00+11:00'),
  -- Daniel with Robert the day before the reference day (the design's Daniel has no patient on the 30th)
  ('d-r-1', '002', '102', '2026-11-29T09:00:00+11:00', '2026-11-29T11:00:00+11:00'),
  -- One shift each for the other carers, so each sees Margaret (read access comes from shifts)
  ('s-m-1', '001', '103', '2026-12-02T09:00:00+11:00', '2026-12-02T12:00:00+11:00'),
  ('m-m-1', '001', '104', '2026-12-03T09:00:00+11:00', '2026-12-03T12:00:00+11:00'),
  ('f-m-1', '001', '105', '2026-12-04T09:00:00+11:00', '2026-12-04T12:00:00+11:00')
) as s (n, client, carer, starts_at, ends_at);

-- Kookaburra Care's carer with Kookaburra Care's client (negative tests)
insert into public.shifts (id, organisation_id, client_id, carer_id, starts_at, ends_at, created_by, created_at) values
  (md5('shift:g-w-1')::uuid, 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000202',
   '2026-12-01T10:00:00+11:00', '2026-12-01T12:00:00+11:00', '10000000-0000-4000-8000-000000000201', '2026-11-25T09:00:00+11:00');

-- ---------------------------------------------------------------------------
-- Documents (metadata; scripts/seed.mjs uploads the placeholder file, 193 bytes, behind each)
-- ---------------------------------------------------------------------------
insert into public.documents (id, client_id, event_id, storage_path, filename, mime_type, size_bytes, uploaded_by, uploaded_at) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', null,
   'clients/c0000000-0000-4000-8000-000000000001/d0000000-0000-4000-8000-000000000001/Care plan.pdf',
   'Care plan.pdf', 'application/pdf', 193, '10000000-0000-4000-8000-000000000011', '2026-10-01T10:00:00+10:00'),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', null,
   'clients/c0000000-0000-4000-8000-000000000001/d0000000-0000-4000-8000-000000000002/Medication schedule.pdf',
   'Medication schedule.pdf', 'application/pdf', 193, '10000000-0000-4000-8000-000000000011', '2026-10-02T09:30:00+10:00'),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003',
   'clients/c0000000-0000-4000-8000-000000000001/d0000000-0000-4000-8000-000000000003/Physio referral.pdf',
   'Physio referral.pdf', 'application/pdf', 193, '10000000-0000-4000-8000-000000000011', '2026-09-02T14:20:00+10:00'),
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003',
   'clients/c0000000-0000-4000-8000-000000000001/d0000000-0000-4000-8000-000000000004/Exercise plan.pdf',
   'Exercise plan.pdf', 'application/pdf', 193, '10000000-0000-4000-8000-000000000011', '2026-09-04T09:05:00+10:00'),
  ('d0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'clients/c0000000-0000-4000-8000-000000000001/d0000000-0000-4000-8000-000000000005/Medication chart.pdf',
   'Medication chart.pdf', 'application/pdf', 193, '10000000-0000-4000-8000-000000000011', '2026-10-12T10:15:00+11:00');

reset session_replication_role;
