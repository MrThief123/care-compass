# F0-23 — Link uploaded documents to a new event

| Field | Value |
|---|---|
| Feature ID | F0-23 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (with a small Family wiring change) |
| Development branch (PR target) | `main` (CHG-036) |
| Feature branch | `feature/shared-document-event-linking` |
| Documentation | `docs/development/shared/shared-document-event-linking/` |
| Lane | S — Shared |
| Sprint | SPRINT |
| Status / owner | See PROGRESS.md |

> **Added by CHG-045, 2026-10-02.** Closes the follow-up in FAM-08 FD-01.

## Purpose
A file added on Add event ends up on the event that is then saved, the same as on Edit event.

## Problem
`documents` allows update of `detached_at` only (F0-13, `20260927020000_documents.sql`). On Add event there is no event id when a file is chosen, so the document is created with no `event_id` and nothing a client session can do later sets it. FAM-08 therefore shows "Save the event first, then open it again to add files." on Add event.

## Description
1. New migration (via `supabase migration new`, additive): `link_document_to_event(p_document_id uuid, p_event_id uuid)`, `SECURITY DEFINER`, `set search_path = public`. It sets `documents.event_id` once, and only when all of these hold:
   - the caller is signed in and `can_access_client_documents` is true for the document's client;
   - the document exists, has no `event_id` and no `detached_at`;
   - the document's `uploaded_by` is the caller;
   - the event exists and belongs to the same client as the document.
   It returns nothing on success and raises a generic error otherwise (no detail about which check failed). `execute` is revoked from `public` and `anon` and granted to `authenticated` only. The existing `audit_documents` trigger records the change.
2. New Server Action `linkDocumentsToEvent({ eventId, documentIds })` in `src/server/documents/actions.ts`, Zod-validated, `NOT_AVAILABLE` in mock mode. It calls the function for each id and reports which ids failed.
3. Add event: a chosen file uploads at once with no `eventId` (as `uploadDocument` already allows), its tile appears, and the new document ids are kept in the form. Save event runs `createEvent`, then `linkDocumentsToEvent` with those ids. The "Save the event first" message is removed.

## User value
Referrals, plans and evidence attached while adding an event are on the event from the start.

## Users
Family (Add event). The function allows any user who can access the client documents of that client, and the uploader guard keeps it to their own uploads.

## Scope
- The migration, with pgTAP tests in the same change.
- `linkDocumentsToEvent` action and its tests.
- Add mode of `src/features/family-event-form` (`EventDocuments`, `event-form-screen`).
- Docs, CHG-045.

## Out of Scope
- Moving a document from one event to another, or unlinking (use `detachDocument`).
- Any change to the `documents` table, columns, grants or policies.
- Edit event, which already links on upload (FAM-08).
- Deleting files left over after Cancel (retained in perpetuity, CIS3; see Error / Edge Cases).
- Carer or admin forms.

## Functional Requirements
- The function links only an unlinked, attached document the caller uploaded, to an event of the same client.
- Linking is one-way and once: a document with an `event_id` is never relinked.
- The event is saved even if linking fails (the failure is shown, FD-02).
- The function and the action never return another client's data.

## UI / UX Requirements
- No new screens. The Add file tile behaves as on Edit event. A link failure shows an inline message naming the files that did not attach, and the event page still opens.
- Existing tokens and kit components only.

## Dependencies
- Features: F0-11 (`care_events`), F0-13 (`documents`, `can_access_client_documents`), FAM-08 (`EventDocuments`, `uploadDocument` use). All merged.
- Blocking open decisions: None

## Inputs
- `documentIds` returned by `uploadDocument` on Add event; the `eventId` returned by `createEvent`.

## Outputs
- `documents.event_id` set; the event's documents list includes the files.

## Error / Edge Cases
- Cancel after uploading: the files have no event, so they stay as client-level documents (visible in the client's documentation list) and are not removed. This is what FAM-08 FD-01 already described for uploaded-then-cancelled files.
- Same document id linked twice (double submit): the second call is refused and the first link stands.
- Save succeeds, link fails for some files: the event exists; the user is told which files did not attach and can add them again on Edit event.
- Document and event of different clients, unknown ids, malformed ids: refused.

## Security / Permissions
- Authority is the database. The function checks access and ownership itself, because `SECURITY DEFINER` bypasses RLS. `search_path` is pinned, and `anon` cannot execute it. Errors carry no filename, id or client detail. No PII in logs.
- No new table, so no new RLS. The function is covered by pgTAP (CLAUDE.md §3 and §7).

## Technical Considerations
- Create the migration with `supabase migration new`; never hand-pick a version.
- Follow the `register_account` / `transfer_client_organisation` pattern for `SECURITY DEFINER` functions in this repo.
- Read `node_modules/next/dist/docs/` for Server Actions before changing the action (CLAUDE.md §14).
- The migration only adds a function, so no other feature's reads change.

## Traceability
- Product requirements: REQ-22
- Sources: CHG-045; FAM-08 FD-01; F0-13.

## Labels
None PROPOSED.
