-- [ADM-04] Admin Clients: an admin can read a linked family member's name
--
-- ADM-04's list shows each client's family contact by name (PRD.md Scope: FAMILY CONTACT column).
-- `client_family_members_select` already lets an admin read the *link* row for their own clients
-- (`is_admin_of_client`, 20260922053821_tenancy.sql), but the linked `profiles` row has its own RLS,
-- and no existing policy covers it: `profiles_select_same_org` only matches when the family member
-- shares the admin's organisation_id, which a self-registered family account usually does not (PD-057
-- — a family account starts with no organisation at all, only linking one later). Without this, the
-- family contact's name is invisible to the admin under RLS, even though the link itself is visible.
--
-- Narrow and additive: only a profile linked, via client_family_members, to a client the caller
-- administers becomes readable — nothing else about that profile's visibility changes, and no
-- existing policy is altered.
create policy profiles_select_linked_family on profiles
  for select
  using (
    exists (
      select 1
      from client_family_members cfm
      where cfm.profile_id = profiles.id
        and is_admin_of_client(cfm.client_id)
    )
  );
