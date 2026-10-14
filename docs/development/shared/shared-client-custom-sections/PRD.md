# F0-26 — Custom sections on Client Details (Family, Carer and Admin)

| Field | Value |
|---|---|
| Feature ID | F0-26 |
| Dashboard / stream | Shared (Family, Carer and Admin Client Details) |
| Phase | Phase 3 — Data wiring & behaviour |
| Development branch (PR target) | `main` |
| Feature branch | `feature/shared-client-custom-sections` |
| Documentation | `docs/development/shared/shared-client-custom-sections/` |
| Lane | S — Shared |
| Sprint | SPRINT · planned D21 |
| Status / owner | See PROGRESS.md |

## Purpose
Let the people caring for a client add their own headings to Client Details.

## Problem
Client Details has three fixed text sections: Description, Habits and Medical history. Families keep information that fits none of them, such as communication, behaviours of concern or key contacts. Today that gets squeezed into Description or not recorded. The client (Peter) asked to add and delete sections the way budget buckets are added and removed (CHG-061).

## Description
Below the three built-in sections, Client Details lists the client's **custom sections** in the order they were added. An **Add section** control opens an inline form with a title and text. Each custom section has **Edit**, which edits both its title and text, and **Remove section**, which asks for confirmation before deleting it. The built-in sections keep their current behaviour and cannot be renamed or removed.

## User value
Families and carers record whatever matters for this person without waiting for a new field to be built.

## Users
- Family, Carer (assigned patients; writes only on shift), Admin (client's own organisation)

## Scope
- Migration: new table `client_custom_info_sections` (`id`, `client_id`, `title`, `body`, `created_by`, `updated_by`, `created_at`, `updated_at`), RLS enabled in the same migration, audit trigger (F0-08). Title unique per client, case-insensitive.
- RLS, matching today's `client_info_sections` rules and adding delete:
  - select: family of the client, an assigned carer (`is_assigned_carer`), an admin of the client's organisation.
  - insert, update, delete: family of the client; a carer on an active shift with the client (`carer_on_active_shift`); an admin of the client's organisation (the AAL2 rule from F0-21 applies). Writes set `updated_by = auth.uid()`.
- Contract in `src/server/clients/` (mock and Supabase): `getClientCustomSections(clientId)` (read, oldest first) and server actions `addClientCustomSection`, `updateClientCustomSection` (title and body), `removeClientCustomSection`, all validated with Zod.
- Family and Admin: `FamilyInfoView` (`src/features/family-info/`) lists custom sections after Medical history and before Documentation, with Add section, Edit and Remove section.
- Carer: `CarerInfoView` (`src/features/carer-patients/`) shows the same on shift; off shift, custom sections are read-only and an empty one is hidden (as the built-ins already behave).
- Inline delete confirmation: "Remove <title>? Its text will be lost." with **Remove** and **Keep**, like Remove bucket.

## Out of Scope
- Renaming or removing Description, Habits or Medical history.
- Reordering sections (they stay in the order added).
- Rich text, attachments per section, summary flags, proforma forms and archive (PL-13, PL-22, OQ-38 stay open).
- Restoring a removed section from the UI (the audit log keeps its text).
- Organisation-wide section templates.

## Functional Requirements
- Title: required, trimmed, 1–60 characters; must not match another section on the same client, including the built-in titles and "Documentation" (case-insensitive).
- Text: optional, up to 5,000 characters (same as the built-ins). A section with no text reads "Nothing added yet."
- At most 20 custom sections per client (FD-03). At the limit Add section is replaced by a short note.
- A saved add, edit or removal survives a reload. Add, edit and delete are audited; delete keeps the old title and text in the audit row.
- A refused save (for example, the carer's shift ended mid-edit) shows the server's message and keeps the draft.

## UI / UX Requirements
- Same card look as the built-in sections (`info-section-card` / `carer-info-section-card`); tokens only; 44×44px targets; labelled fields; status not shown by colour alone.
- After add, focus moves to the new section's heading; after remove, focus moves to Add section.
- Long titles and text wrap without overflow at every width from 1920 to 768 px.
- No Figma design: built from the existing section card and form kit (FD-05).

## Dependencies
- Features: FAM-09, CAR-04, ADM-11, F0-08, F0-21 (all merged)
- Blocking open decisions: None
- Non-blocking open decisions: OQ-38 (stays open; this feature does not close it)

## Inputs
- `clientId` from the route; section title and text.

## Outputs
- Created, renamed, edited and deleted custom sections; audit rows.

## Error / Edge Cases
- Duplicate or reserved title: message under the title field, draft kept.
- Two people add the same title at once: the unique index refuses the second one with the same duplicate message.
- Section removed by someone else while being edited: save shows "This section no longer exists." and the list refreshes.
- Read failure: the page's existing error state.
- Mock data mode: fixture custom sections show; add, edit and remove say "Saving changes is not available yet.", as the built-in sections already do.

## Security / Permissions
- RLS is the only gate. The UI hides controls a user cannot use (absent, not disabled), but never grants access.
- Section text may be health information: no titles or text in logs (ARCHITECTURE.md §12.5).

## Technical Considerations
- A separate table, not a change to `client_info_sections`: its `key` check and missing DELETE policy belong to the built-ins and stay as they are (FD-01).
- Additive migration created with `supabase migration new`.

## Traceability
- Product requirements: REQ-11 (client information can be extended with new headings)
- Sources: client request (Peter), relayed in-session 2026-10-12; CHG-061; CIS3 Data 2A

## Labels
CONFIRMED · PROPOSED
