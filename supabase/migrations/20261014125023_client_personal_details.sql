-- [F0-28] Client personal details (CHG-063)
--
-- Six optional columns on clients for the person's own contact details and an emergency
-- contact. date_of_birth and suburb already exist (F0-01 schema) and are reused; age is computed
-- from date_of_birth, never stored (FD-03). Additive only: no column is renamed or dropped.
-- Read through the existing clients select policies (family, an assigned carer, an admin of the
-- client's organisation); no new policy. The audit_clients trigger (F0-08) logs every change.
--
-- save_client_details(...) writes these eight fields. SECURITY DEFINER because families have no
-- UPDATE policy on clients and must not get one: RLS cannot limit an UPDATE to some columns, so
-- a policy would let a family rewrite organisation_id (FD-01). Authority is checked inside: only
-- a family member of the client (is_family_of). Every field is replaced; null or blank clears it.
-- Errors: 42501 not permitted, 23514 a value fails its check.

alter table clients
  add column email text,
  add column phone text,
  add column address text,
  add column emergency_contact_name text,
  add column emergency_contact_relationship text,
  add column emergency_contact_phone text;

-- Shapes match src/server/clients/client-details-schema.ts, which checks first; these are the
-- backstop. "Not in the future" needs today's date, so save_client_details checks it instead.
alter table clients
  add constraint clients_date_of_birth_range check (date_of_birth >= date '1900-01-01'),
  add constraint clients_email_shape check (
    email is null or (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
  ),
  add constraint clients_phone_shape check (phone is null or phone ~ '^[0-9 +()-]{6,20}$'),
  add constraint clients_address_length check (address is null or char_length(address) <= 200),
  add constraint clients_suburb_length check (suburb is null or char_length(suburb) <= 100),
  add constraint clients_emergency_contact_name_length check (
    emergency_contact_name is null or char_length(emergency_contact_name) <= 100
  ),
  add constraint clients_emergency_contact_relationship_length check (
    emergency_contact_relationship is null or char_length(emergency_contact_relationship) <= 60
  ),
  add constraint clients_emergency_contact_phone_shape check (
    emergency_contact_phone is null or emergency_contact_phone ~ '^[0-9 +()-]{6,20}$'
  );

create or replace function save_client_details(
  p_client_id uuid,
  p_date_of_birth date,
  p_email text,
  p_phone text,
  p_address text,
  p_suburb text,
  p_emergency_contact_name text,
  p_emergency_contact_relationship text,
  p_emergency_contact_phone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_client_id is null or not is_family_of(p_client_id) then
    raise exception 'only a family member of the client can change these details'
      using errcode = '42501';
  end if;

  if p_date_of_birth > (now() at time zone 'Australia/Melbourne')::date then
    raise exception 'the date of birth is in the future' using errcode = '23514';
  end if;

  update clients
  set date_of_birth = p_date_of_birth,
      email = nullif(btrim(p_email), ''),
      phone = nullif(btrim(p_phone), ''),
      address = nullif(btrim(p_address), ''),
      suburb = nullif(btrim(p_suburb), ''),
      emergency_contact_name = nullif(btrim(p_emergency_contact_name), ''),
      emergency_contact_relationship = nullif(btrim(p_emergency_contact_relationship), ''),
      emergency_contact_phone = nullif(btrim(p_emergency_contact_phone), ''),
      updated_at = now()
  where id = p_client_id;
end;
$$;

revoke all on function save_client_details(uuid, date, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function save_client_details(uuid, date, text, text, text, text, text, text, text)
  to authenticated;
