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
