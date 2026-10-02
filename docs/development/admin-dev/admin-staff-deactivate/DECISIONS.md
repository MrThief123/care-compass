# Decisions — ADM-03 Admin — Deactivate staff

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

None. OQ-36 answered as PD-039 and OQ-19 as PD-052 (both 2026-09-17, root DECISIONS.md).

## Feature decisions log

### FD-01 — Deactivation is `profiles.is_active = false` through one DB function; no service role, no auth ban
- Date: 2026-10-02
- Context: PD-039 says deactivated staff lose access immediately and keep their history. `is_active` already gates `current_profile()`, `is_family_of`, `is_assigned_carer`, `current_organisation_id`, `signIn` (`src/server/auth/actions.ts`) and the route guard (`resolveActiveProfile` signs out and redirects to `/sign-in?reason=inactive`).
- Decision: new additive migration with `admin_deactivate_staff(p_profile_id uuid) returns profiles`, SECURITY DEFINER, caller checked with `admin_current_org_id()` (active admin, AAL2), target must be a carer of that organisation. No `src/server/jobs/**` change and no Supabase auth ban.
- Reason: smallest change that meets the ACs; the existing gates already cover sign-in and mid-session requests.
- Alternatives considered: banning the auth user through the service role (rejected: second mechanism, needs a lane B file, nothing in the ACs needs it).
- Consequences: a still-valid JWT stays valid until it expires, but every read returns nothing and the guard signs the user out on the next request. Completions snapshot the actor name and have no FK to profiles, so history is unchanged.
- Human confirmation required: no (follows PD-039).

### FD-02 — Shifts: cancel future, end the one in progress now
- Date: 2026-10-02 · Decided by: Dhruv Verma (asked in the START session)
- Decision: for every client, future shifts get `cancelled_at = now()` and the shift running now gets `ends_at = now()`. Past and already-cancelled shifts are untouched. Same treatment as `admin_end_carer_assignment` (ADM-08) and `transfer_client_organisation`.
- Reason: resolves the PROPOSED line in the PRD; access is derived from shifts (PD-041) so there is no assignment table to close.
- Human confirmation: CONFIRMED 2026-10-02.

### FD-03 — Inactive carers stay in the Staff list in a separate section; no reactivation
- Date: 2026-10-02 · Decided by: Dhruv Verma
- Decision: active carers in the main list; deactivated carers in an "Inactive" section below it, each with an "Inactive" tag, and the name still opens the panel (no Deactivate button for an inactive carer). Reactivation is out of scope; if wanted, raise as a Parking lot item.
- Reason: admins keep sight of past staff; PRD lists only Deactivate.
- Human confirmation: CONFIRMED 2026-10-02.

### FD-04 — Design gap built from tokens (PD-052)
- Date: 2026-10-02
- Decision: no Figma design exists for Deactivate. Build with `ConfirmationModal`, the existing Pending-tag style and ADM-08's panel patterns. The PR must say "design gap, built from tokens, please review".
- Human confirmation required: yes, at PR review.

### FD-05 — Acceptance criteria and PRD updated before implementation
- Date: 2026-10-02
- Context: the planning pack had 2 ACs and "BLOCKED until designed" / PROPOSED scope text.
- Decision: kept AC-01 and AC-02 verbatim; added AC-03 to AC-09 and rewrote the PRD Scope, UI, Edge and Technical sections to record FD-01 to FD-04. Per CLAUDE.md §9 this records answers the human gave on 2026-10-02. `DEVELOPMENT_PLAN.md` card (2 criteria, 1 db + 1 integration) and its criteria total were not edited here (CHG-052 notes totals-line conflicts between in-flight branches); update them in the PR docs commit once the numbers are settled.
- AC-02 wording: it says 'Done · Marcus C.', but CHG-032 shows full names everywhere and completions store the full name, so the test asserts 'Marcus Chen'. Same behaviour, current naming; flagged for the PR.
- Human confirmation: CONFIRMED 2026-10-02 (answers in session).

### FD-06 — Admin can read inactive carers of their own organisation (new RLS policy)
- Date: 2026-10-02
- Context: FD-03 needs the Staff list to show inactive carers, but `profiles_select_same_org` only matches `is_active` rows, so after deactivation `getAdminStaff` returned nothing for that carer (T-10 failed for this reason, not for a missing function).
- Decision: the same migration adds `is_admin_of_organisation(uuid)` (SECURITY DEFINER, active admin at AAL2 of that organisation) and the policy `profiles_select_inactive_carers_for_admin` (`role = 'carer' and not is_active and is_admin_of_organisation(organisation_id)`). Additive; no existing policy changed.
- Reason: smallest way to meet AC-08 under RLS without a second read path; Manage's pickers still filter `is_active = true` themselves, so deactivated carers are not offered when assigning.
- Alternatives considered: a SECURITY DEFINER `admin_inactive_staff()` list function (rejected: a second read path the Staff query would need to merge).
- Consequences: a PR that alters `profiles` read access, so it is called out in the PR summary. `supabase/tests/admin_inactive_carers_rls.test.sql` (6 assertions) added for the policy's edges.
- Human confirmation required: yes, at PR review (access-control change).

### FD-07 — Notes from implementation
- Mock-mode Manage (`/admin/manage`) is a static fixture (`ADMIN_MANAGE`) that never reflects the mock staff store, so a carer deactivated in mock mode still appears there. Real data excludes them (checked with a throwaway integration run). Not changed: out of ADM-03 scope.
- The worktree's `node_modules` is a symlink to the main checkout; Turbopack refuses it, so `next build`/`next dev` are run with `--webpack` here.
- The full vitest run shows 197 failures in 14 files (family task screens, family budget, admin-manage, carer-complete-task, etc.). 41 of them reproduce on this branch with ADM-03 changes stashed, in the files re-run; none are in ADM-03 files. Not investigated here.

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->

## FD-08 — Manage stops offering a deactivated carer in mock mode
Reported at review: a deactivated carer could still be picked in Manage and given a shift. Real data already excluded them (`is_active` filter on the list). Mock Manage is a static fixture, so `getAdminManage` now drops carers the staff store marks inactive (matched by full name). Test `[ADM-03][AC-08]` added in `manage-queries.test.ts`.
**Open (not built, scope):** `assignShift` and the `shifts_before_insert` trigger do not refuse an inactive carer, so a stale Manage tab or a direct call could still create a shift. Fix would be a trigger check in a new migration; needs a human call.
