# Decisions — ADM-02 Admin — Staff list and add/edit staff

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Answer |
|---|---|---|---|
| OQ-08 | Account provisioning, sign-in method and MFA | YES | ANSWERED — PD-040, amended by PD-057/CHG-010: carers stay admin-invited (unchanged for ADM-02); no mandatory MFA for any role. |
| OQ-13 | Staff names and job titles | YES | ANSWERED — PD-038: store and always display the full first + last name (not "Aisha R."); job titles are a fixed seeded list (the "editable" part is a gap, see FD-01). |
| OQ-36 | Staff deactivation | no | ANSWERED — PD-039: a Deactivate action with confirmation, but that's ADM-03's scope, already excluded from ADM-02's Out of Scope. |

## Feature decisions log

### FD-01 — Out-of-lane `src/server/jobs/` file; canonical StaffMember type; roles list gap; test levels; shared fixture reuse
- Date: 2026-09-29
- Context: several implementation choices had no existing precedent or crossed a lane boundary, and
  needed a decision before code could be written.
- Decisions:
  1. **Out-of-lane file (CLAUDE.md §4.2), human-approved in-session.** Creating a carer's account
     needs `auth.admin.inviteUserByEmail`, which only works with the service-role client
     (`createAdminClient`), which is lint-enforced (`eslint.config.mjs`) to only be importable from
     `src/server/jobs/**` — Lane B's folder, not Lane A's. A signed-in admin's own session cannot
     create another user's `auth.users` row (`supabase.auth.signUp()` would sign the caller in as the
     new user instead), so there is no in-lane alternative. Added
     `src/server/jobs/admin-invite-staff.ts` (one function, `inviteStaffAccount`), asked the human
     first (they said "Add it anyway, flagged"), and flag it here and in the PR rather than doing it
     silently. The rest of the write path (profile insert/update, invite clean-up) goes through RLS-
     backed RPCs (`supabase/migrations/20260929000000_admin_staff.sql`) callable from the admin's own
     session — only the one `auth.admin` call needed the escape hatch, mirroring
     `discard_unregistered_account()`'s reasoning in `20260927010000_sign_up.sql`.
  2. **Canonical `StaffMember` type (human, in-session: "Adopt canonical domain type").** Replaced the
     local flat `{ name, role }` type in `staff-queries.ts` with `src/types/domain.ts`'s
     `StaffMember`/`StaffMemberSchema` (`firstName`/`lastName`/`jobTitle`/`isActive`), matching PD-038.
     The Add/Edit panel now has separate First name/Last name fields instead of one Name field — a
     real, deliberate UI change, not just a data-source swap.
  3. **Roles list stays fixed, not per-organisation-editable.** PD-038 says job titles are "a
     per-organisation editable list, seeded with" the three design values, but no table or mechanism
     for editing that list exists, and ADM-02's own Scope never describes building one (no "manage job
     titles" UI is drawn or asked for). Kept the three seeded titles as a fixed constant
     (`STAFF_JOB_TITLES`, `src/server/admin/staff-mock-store.ts`). The editable-list mechanism is a
     gap for a future feature (most likely ADM-10 Admin Settings) to close, not ADM-02's to invent.
  4. **Mock-mode staff store reuses the shared, already-canonically-shaped `STAFF_MEMBERS` fixture**
     (`src/mocks/fixtures.ts`, Lane S) instead of the old local `src/mocks/admin-staff.ts`
     (`adminStaffFixture`), which is now unreferenced by `getAdminStaff()`. `STAFF_MEMBERS` already
     existed, canonically shaped, and was previously used only by `CARER_PROFILES`'s derivation and
     its own fixture test — read-only reuse, no Lane S file edited. `src/mocks/admin-staff.ts` is left
     in place (not deleted, since deleting a Lane S file is also an edit) — flagged here and in the PR
     as safe to remove.
  5. **Mock-mode create/edit needed somewhere real to write** (the client component now always calls
     the server action, mock or supabase, matching `events`/`budget`'s established pattern — see
     `src/features/family-event-form/event-form-screen.tsx`'s `save()`). Mutating the shared
     `STAFF_MEMBERS` array directly would corrupt other fixtures that derive from it
     (`CARER_PROFILES`). Added `src/server/admin/staff-mock-store.ts` (Lane A's own folder): a
     module-scoped mutable copy, seeded once from `STAFF_MEMBERS`.
  6. **Test levels for T-01/T-03 changed from the plan's "e2e" to integration + component** (see
     TEST_PLAN.md's note above the table): a real invite/RLS round trip is a data/permission concern
     an integration test covers directly; a full browser e2e would exercise the same server code at
     much higher cost for the same coverage. The client-side prefill/validation behaviour these ACs
     also describe is covered at component level instead (mocking `createStaff`/`updateStaff`, the
     established pattern — see `event-form-add.test.tsx`'s own comment making the same call for
     `createEvent`).
- Reason: each choice follows the nearest existing precedent (sign-up's compensating clean-up, events'
  action-call pattern, budget's mock-vs-real query split) rather than inventing a new one, except (1)
  and (2)/(3), which the human decided directly in-session.
- Alternatives considered: skipping account creation and building only list/edit (rejected by the
  human — chose to build it, flagged); keeping the local flat `StaffMember` type (rejected by the
  human — chose the canonical type); a new per-organisation job-title table (rejected — out of ADM-02's
  stated Scope, not asked for by any AC or drawn in the design).
- Consequences: `src/mocks/admin-staff.ts` is now dead code from `getAdminStaff()`'s perspective (not
  deleted, flagged for a Lane S cleanup PR). `src/server/jobs/admin-invite-staff.ts` is an out-of-lane
  addition for human/PR review. The roles list cannot be edited from any screen yet — a real gap
  against PD-038's "editable" wording, tracked here rather than silently built or silently ignored.
- Human confirmation required: yes for (1) and (2), given directly in-session, 2026-09-29 (two
  `AskUserQuestion` exchanges: the lane-boundary file, and the StaffMember type). (3)–(6) are
  implementation choices following existing precedent, not blocking OQs — flagged here for review.
- Test changes caused: `src/features/admin-staff/staff-screen.test.tsx` fully rewritten. Every test
  case's field-level assertions changed (`Name` → `First name`/`Last name`; `role` values → `jobTitle`
  values), since the form itself changed (decision 2). Test IDs changed from `[ADM-UI-03]` to `[ADM-02]`
  since these now test ADM-02's wiring (Save calling real actions), not ADM-UI-03's fixture-only
  behaviour. `src/server/admin/staff-queries.ts` had no test file of its own to change (none existed).
  Flagged HUMAN REVIEW in PROGRESS.md and the PR, since assertions changed on an already-merged,
  working feature's tests.

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
