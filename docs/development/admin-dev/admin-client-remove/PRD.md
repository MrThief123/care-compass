# ADM-05 — Admin — Remove client

| Field | Value |
|---|---|
| Feature ID | ADM-05 |
| Dashboard / stream | Admin (with a small Family banner, FD-04) |
| Phase | Phase 3 — Data wiring & behaviour (parallel: Family · Carer · Admin) |
| Development branch (PR target) | `main` (CHG-036) |
| Feature branch | `feature/admin-client-remove` |
| Documentation | `docs/development/admin-dev/admin-client-remove/` |
| Lane | A — Admin |
| Sprint | SPRINT · planned D18 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2 — data wiring feature.** The Admin Clients screen is delivered on fixtures by **ADM-UI-04** and made real for reading by **ADM-04**. Its Remove link and confirmation already exist as a local-state preview; this feature wires them to the database. Shared components live in the UI kit — change them only through a shared PR.

## Purpose
End an organisation's service to a client without losing anything the family or the records need.

## Problem
The Remove link on the Admin client list only hides the row in the browser. Nothing is saved, and the family is not told the organisation has gone.

## Description
`admin_remove_client(client_id)` detaches the client from the admin's organisation. Staff lose access at once, the family keeps everything, and the family sees a banner on Settings and Home asking them to choose a new organisation (FD-04).

## User value
Organisations can stop serving a client cleanly (OQ-06: Admin 'Remove' detaches without deleting). Families are not left silently without an organisation.

## Users
- Admin (removes)
- Family (sees the banner, chooses a new organisation through the existing FAM-13 picker)

## Scope
- The existing **Remove** link and "Remove client?" confirmation on the Admin client list now call the Server Action `removeClient` (FD-05). On success the row leaves the list and a status message says so; on failure the row stays and an alert says it could not be done.
- `admin_remove_client(p_client_id uuid) returns void` DB function, SECURITY DEFINER, caller checked with `is_admin_of_client` (active admin at AAL2) (FD-01):
  - `clients.organisation_id` becomes null and `clients.organisation_removed_at` is set to now;
  - for that client, future shifts get `cancelled_at = now()` and the shift running now gets `ends_at = now()` (FD-02); past and already-cancelled shifts are untouched;
  - nothing is deleted: routines, events, completions, budget, documents, family links and history stay.
- Additive migration: column `clients.organisation_removed_at timestamptz` and a trigger that clears it whenever `organisation_id` becomes non-null (so FAM-13's `transfer_client_organisation` needs no change) (FD-03).
- Family side (FD-04, human direction 2026-10-03): when `organisation_removed_at` is set and the client has no organisation, a **banner** appears
  - on Family **Settings**, next to the Change organisation card, with a **Choose organisation** button that opens the existing FAM-13 picker (which today has no way in for a client with no organisation);
  - on Family **Home**, above the content, linking to Settings.
  No notification, email or badge system: the banner is all. It goes away once the family chooses a new organisation.
- `ClientHeaderSummary` (in `src/server/clients/queries.ts`) gains `organisationRemoved?: boolean`.
- Mock mode: an in-memory store (`clients-mock-store.ts`) so Remove works on fixtures and `getAdminClients` reflects it (FD-06).
- Built from Foundations tokens and existing patterns; flagged for human review in the PR (PD-052).

## Out of Scope
- Deleting any client data.
- Any notification system: email, in-app inbox, badge (human, 2026-10-03).
- Undoing a removal from the admin side. Only the family can move the client to a new organisation (FAM-13).
- A "Removed" section for admins: the outgoing organisation has no access (REQ-04, FD-01).
- Carrying a mock-mode removal over to the Family screens (FD-06).
- Changing how a family-created client with no organisation looks: it has no `organisation_removed_at`, so no banner and no Choose button (FAM-13 AC-06 stands).

## Functional Requirements
- Family retains access to everything, including the client's events, after removal.
- Carers and admins of the organisation read zero rows for the client on their next request.
- Past completions keep their snapshotted names; history is untouched (REQ-N6).

## UI / UX Requirements
- No Figma design (OQ-19, PD-052): banner and button built from tokens and the existing Settings and Home patterns. Nothing overlaps at any width; long names wrap.
- Admin confirmation keeps the ADM-04 wording and adds one line: the family keeps all records and will be asked to choose a new organisation (exact text in the tests).
- The banner is a persistent element, not a toast, and is not colour alone (icon or text lead-in). White text never on #0C9BA9.

## Dependencies
- Features: ADM-04 (MERGED), FAM-13 (MERGED, its picker is reused)
- Blocking decisions: OQ-06, OQ-07 (ANSWERED, PD-036, PD-037) and OQ-19 (ANSWERED, PD-052)
- Non-blocking open decisions: None

## Inputs
- client id (the Server Action takes the id of a client in the admin's organisation)

## Outputs
- A detached client; the Admin list without it; a family banner.

## Error / Edge Cases
- Removing a client already removed, another organisation's client, or an unknown id: refused (42501), nothing changes. An already-removed client is no longer readable to the admin, so it cannot be removed twice.
- A blank id: VALIDATION. An unknown id in mock mode: NOT_FOUND.
- A family chooses a new organisation: `organisation_removed_at` clears, banner goes (trigger).
- The family sign-up client (no organisation, never removed): no banner.

## Security / Permissions
- Own organisation only; active admin at AAL2. Carers, family, other organisations' admins and admins without MFA are refused.
- Every new column and function is covered by the existing RLS on `clients`; no policy change. The function is the only writer of `organisation_removed_at` for callers under RLS.

## Technical Considerations
- One additive migration created with `supabase migration new`. It alters `clients` (read by Family, Carer and Admin features), so the PR says so. Add only: no rename or drop.
- Same shift treatment and patterns as `transfer_client_organisation` and `admin_end_carer_assignment` (ADM-08).
- Server Action `removeClient` in `src/server/admin/clients-actions.ts`, mock store `src/server/admin/clients-mock-store.ts`. Regenerate `src/lib/supabase/database.types.ts`.
- Audit rows come from the existing `audit_row_change` triggers on `clients` and `shifts` (F0-08).
- Cross-lane edits recorded in FD-04: `src/features/family-settings/**`, `src/features/family-home/**`, the two `src/app/(family)/**` pages, `src/server/clients/queries.ts`.

## Traceability
- Product requirements: REQ-04 (A client belongs to one organisation at a time; the family can move the client to another …), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: UI-D28; CIS3 #9 (data must not be lost); Design: Admin · Clients 'Remove'; PD-036 (OQ-06); human direction 2026-10-03 (banner)
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
