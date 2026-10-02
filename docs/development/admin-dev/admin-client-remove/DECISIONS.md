# Decisions — ADM-05 Admin — Remove client

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

None. OQ-06 (PD-036) and OQ-07 (PD-037) are ANSWERED, and OQ-19 is ANSWERED as PD-052 (all 2026-09-17, root DECISIONS.md).

## Feature decisions log

### FD-01 — Remove is a detach through one DB function: `admin_remove_client`
- Date: 2026-10-03
- Context: OQ-06 / PD-036 say Admin 'Remove' detaches without deleting. The PRD's PROPOSED line was `clients.organisation_id` null, end assignments, cancel future shifts. There is no assignment table (PD-041): carer access comes from shifts.
- Decision: additive migration with `admin_remove_client(p_client_id uuid) returns void`, SECURITY DEFINER, caller proved with `session_is_aal2()` and `is_admin_of_client` (same checks as `admin_end_carer_assignment`). It sets `organisation_id` null and `organisation_removed_at` now, and treats shifts as in FD-02. No service role. An already-removed client is not readable by the admin, so a second call is refused (42501).
- Reason: smallest change that meets AC-01/AC-02; RLS reads `organisation_id` live, so access ends on the next request.
- Alternatives considered: a hard delete or an `archived` flag (rejected: REQ-N6, and the family must keep the client).
- Consequences: `clients` is read by Family, Carer and Admin features, so the PR says so. Audit rows come from the existing `audit_row_change` triggers.
- Human confirmation: follows PD-036.

### FD-02 — Shifts: cancel future, end the one in progress now
- Date: 2026-10-03 · Decided by: Dhruv Verma (asked in the START session)
- Decision: for the client, future shifts get `cancelled_at = now()` and the shift running now gets `ends_at = now()`. Past and already-cancelled shifts are untouched. Same treatment as ADM-03, ADM-08 and `transfer_client_organisation`.
- Human confirmation: CONFIRMED 2026-10-03.

### FD-03 — A removal marker, `clients.organisation_removed_at`, cleared by a trigger
- Date: 2026-10-03
- Context: a family sign-up creates a client with no organisation (`sign_up` migration), so `organisation_id is null` alone does not mean "removed". The banner must only show after an admin removal.
- Decision: add `clients.organisation_removed_at timestamptz` (nullable, additive) and a BEFORE UPDATE trigger on `clients` that sets it to null whenever `organisation_id` becomes non-null. `transfer_client_organisation` (FAM-13) is not edited.
- Reason: one source of truth; the banner clears itself when the family chooses a new organisation; no change to FAM-13's function.
- Alternatives considered: editing `transfer_client_organisation` to clear it (rejected: touches a merged feature's function for no gain); inferring removal from the audit log (rejected: heavy, fragile).
- Consequences: a PR that alters `clients`, so it is called out. `src/lib/supabase/database.types.ts` is regenerated.
- Human confirmation required: yes, at PR review.

### FD-04 — Family banner on Settings and Home, no notification system (human direction)
- Date: 2026-10-03 · Decided by: Dhruv Verma
- Direction (quoted): "I don't think there should be a notification system. I think under settings, there should just be a little banner that pops up next to Change Organisation … something like that. That should be on the settings page, and maybe that also comes up on the home page as well. That's it. There shouldn't be any other notification thing. It should just be an alert or a button that comes up."
- Decision: a persistent banner (not a toast, no email, no badge, no inbox) on Family Settings, beside the Change organisation card, with a **Choose organisation** button that opens the FAM-13 picker; and on Family Home, a banner with a **Choose organisation** link to Settings. Both show only when `organisationRemoved` is true. Copy: "Your organisation has removed {first name}. Choose a new organisation so {first name}'s care can continue." Each banner is a `region` named "Organisation removed".
- Why a button: FAM-13 AC-06 hides Change when a client has no organisation, so without it a removed family has no way to pick one. The button is shown only for a removed client; a never-registered client is unchanged.
- Cross-lane files this touches, authorised by this direction (CLAUDE.md §4.2: recorded here, human told): `src/features/family-settings/**`, `src/features/family-home/**` (new optional props `organisationRemoved` and `clientFirstName` on `FamilyHomeView`, used only by the Family page, not by the carer Home), `src/app/(family)/family/[clientId]/home/page.tsx` and `settings/page.tsx`, and `src/server/clients/queries.ts` (type `ClientHeaderSummary` extended there with `organisationRemoved?: boolean`, so `src/mocks/**` is not edited). No shared component is edited; the banner is built locally from tokens and `CardShell`.
- Design gap (PD-052): no Figma. Built from tokens; the PR says "design gap, built from tokens, please review".
- Human confirmation required: yes, at PR review (copy and placement).

### FD-05 — Documents updated and ADM-04 preview tests change
- Date: 2026-10-03
- Context: the planning pack had 2 ACs, a blocked UI section and `admin-dev` as the PR target.
- Decision: kept AC-01 and AC-02 verbatim; added AC-03 to AC-10 and US-02; rewrote the PRD Scope, UI, Edge and Technical sections to record FD-01 to FD-04; PR target is `main` (CHG-036). Per CLAUDE.md §9 this records answers the human gave on 2026-10-03. The `DEVELOPMENT_PLAN.md` card (2 criteria, 2 db tests) and its totals are not edited here (CHG-052 notes totals-line conflicts between in-flight branches); update them in the PR docs commit.
- ADM-04 tests that change at implementation (**HUMAN REVIEW: test expectation changed**): `removes only the confirmed client and restores fixtures on remount` (before: the preview reset on remount and read "Changes reset when you reload."; after: Remove calls `removeClient` and the message is "<name> removed.") and `removes the final client into the empty state` (before: synchronous local state; after: waits for the mocked action). `[ADM-04][AC-01]` (dialog text) keeps passing: the dialog wording is extended, not replaced.
- Human confirmation: CONFIRMED 2026-10-03 (answers in session).

### FD-06 — Mock mode
- Date: 2026-10-03
- Decision: `src/server/admin/clients-mock-store.ts` (on `globalThis`, like the staff store) holds the removed ids; `getAdminClients` and `removeClient` use it in mock mode. A mock-mode removal does not reach the Family screens: Admin fixture ids (`margaret`) and Family fixture ids (`client-margaret`) differ, and FAM-13's mock action is a stub. The Family banner is therefore checked with local Supabase for the visual run, and by component tests with `organisationRemoved` set.
- Human confirmation: no.

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
