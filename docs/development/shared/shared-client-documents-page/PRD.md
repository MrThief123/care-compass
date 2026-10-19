# F0-25 — Client Documents page (Family and Carer)

| Field | Value |
|---|---|
| Feature ID | F0-25 |
| Dashboard / stream | Shared (Family and Carer screens) |
| Phase | Phase 3 — Data wiring & behaviour |
| Development branch (PR target) | `main` |
| Feature branch | `feature/shared-client-documents-page` |
| Documentation | `docs/development/shared/shared-client-documents-page/` |
| Lane | S — Shared |
| Sprint | SPRINT |
| Status / owner | See PROGRESS.md |

## Purpose
One place to see, find and download every document held for a client.

## Problem
Documents are scattered: client-level files sit on Info, event files sit inside each event. A family member or carer who wants "the care plan" or "everything for the new GP" has to hunt.

## Description
A Documents page for a client, in two places: a **Documents** item in the Family side rail, and a **Documents** tab on a carer's patient profile. Both show the same screen: every non-detached document for the client (client-level and event-attached), a search box, sorting by name, size or date added, a per-file open/download, and a **Download all** button that returns one .zip.

## User value
Families and carers find and take away any document in seconds.

## Users
- Family, Carer (assigned patients)

## Scope
- New contract read `getAllClientDocuments(clientId)` in `src/server/documents/queries.ts` (mock and Supabase) returning name, MIME type, size, date added (`uploaded_at`), uploader and, for event files, the event title.
- Shared screen in `src/features/client-documents/`: list, search, sort (name, size, date added; ascending or descending), empty, no-match, loading and error states.
- Family route `/family/[clientId]/documents` and rail item; Carer route `/carer/patients/[clientId]/documents` and patient tab.
- Per-file open via the existing `getDocumentUrl` (60-second signed URL).
- Download all: `GET /api/clients/[clientId]/documents/download-all` streams a .zip of every non-detached document, read with the caller's own session (RLS decides access).

## Out of Scope
- Upload, rename, detach or delete (upload stays on Info and event forms; PD-041 on-shift rule untouched).
- Folders, tags, previews, filtering by type or date range.
- Admin dashboard.
- Any migration: "date added" is the existing `documents.uploaded_at` (FD-01).

## Functional Requirements
- Default order: date added, newest first.
- Search is a case-insensitive substring of the file name or the event title.
- Download all always includes every document, not only the filtered ones (FD-04).
- A carer may view and download for any assigned patient, on shift or not (human, 2026-10-08); RLS already allows it.

## UI / UX Requirements
- Tokens only; 44×44px targets; status not colour alone; sort control labelled; result count announced politely.
- Dates shown in `Australia/Melbourne`; sizes human-readable (KB, MB).
- No Figma design: built from the existing table/list kit and tokens (FD-05).

## Dependencies
- Features: F0-13, UI-04, FAM-UI-04, F0-15, CAR-UI-02 (all merged)
- Blocking open decisions: None
- Non-blocking open decisions: none

## Inputs
- `clientId` from the route; search text; sort key and direction.

## Outputs
- Rendered list; a .zip download; a signed URL per opened file. Nothing is written.

## Error / Edge Cases
- No documents: empty state, no Download all.
- Search with no match: no-match state with a Clear search action.
- Duplicate file names in the zip are made unique ("Care plan.pdf", "Care plan (2).pdf").
- Read failure: error state; zip route failure: plain-language error, no partial file.
- Mock data mode: single-file open and Download all say documents are not available yet.

## Security / Permissions
- RLS (`can_access_client_documents`) is the only gate; the route uses the signed-in user's session, never the service role.
- Unsigned or unauthorised callers get the same empty response (no enumeration).
- No file names or client data in logs (ARCHITECTURE.md §12.5).

## Technical Considerations
- PROPOSED: search and sort run in the browser over the loaded list (a client holds tens to low hundreds of files).
- PROPOSED: new dependency `fflate` (small, no native code) for streaming zip; no compression (files are already compressed). Limit 300 files per download (FD-03).

## Traceability
- Product requirements: CIS3 document storage; CHG-058
- Sources: human request, in-session 2026-10-08

## Labels
CONFIRMED · PROPOSED
