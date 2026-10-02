-- ADM-03 FD-08: an admin can't give a shift to a deactivated carer. Manage already hides them,
-- but its list can be stale and the insert is a public endpoint, so the rule is enforced here.
-- Only the INSERT policy changes: cancelling or ending a deactivated carer's shifts still works.
-- Done in the policy, not the shifts_before_insert trigger, so server-side fixtures and jobs that
-- run outside RLS are unaffected.
drop policy shifts_insert_admin on shifts;
create policy shifts_insert_admin on shifts
  for insert to authenticated
  with check (
    is_admin_of_client(client_id)
    and exists (select 1 from profiles p where p.id = carer_id and p.role = 'carer' and p.is_active)
  );
