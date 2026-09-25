-- [FAM-12] Family — Settings: a signed-in user can update their own contact
-- details, and nothing else about their profile.
--
-- Row: only the user's own profile row (`profiles_update_self`).
-- Columns: only first_name, last_name, phone, email and address. `role`,
-- `organisation_id`, `is_active` and `job_title` stay out of a user's reach, so a
-- family user cannot promote themselves or move to another organisation by
-- editing their own row (column-level privileges are checked before RLS, so this
-- fails with 42501 whatever the row). The service role and later admin-managed
-- changes (ADM-02, ADM-03) do not go through this grant.
--
-- `email` here is the contact email (PD-054), never the login email in auth.users.

create policy profiles_update_self on profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

revoke update on profiles from anon, authenticated;
grant update (first_name, last_name, phone, email, address) on profiles to authenticated;
