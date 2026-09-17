# F0-13 — Client document storage

| Field | Value |
|---|---|
| Feature ID | F0-13 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-document-storage` |
| Documentation | `docs/development/shared/shared-document-storage/` |
| Lane | B — Backend |
| Sprint | SPRINT · planned D6–D7 |
| Status / owner | See PROGRESS.md |

## Purpose
Provide one secure document pipeline for all file tiles in the UI.

## Problem
Medical documents are highly sensitive; public URLs or unrestricted buckets would leak them.

## Description
Stores uploaded files (care plans, reports, photos) for a client, optionally attached to an event, retained in perpetuity with access mirroring client access.

## User value
Evidence and medical documents are kept safely and found again.

## Users
- Family
- Carer
- Admin

## Scope
- Private storage bucket `client-documents`; object path `clients/{client_id}/{document_id}/{filename}`.
- `documents` table: id, client_id, event_id null, storage_path, filename, mime_type, size_bytes, uploaded_by, uploaded_at, detached_at null.
- Storage RLS mirroring `documents` row access.
- Server action `uploadDocument(clientId, file, eventId?)` validating type and size (limits per OQ-26).
- Server function `getDocumentUrl(documentId)` returning a short-lived signed URL (PROPOSED 60 s).
- No hard delete: `detachDocument` sets detached_at (perpetual retention, CIS3).

## Out of Scope
- File tile UI (FAM-08, FAM-09)
- Email ingestion of documents (CIS3 mentions; parked)
- Virus scanning (not in sources; flag in INT-05)

## Functional Requirements
- Uploaded file is linked to the client and optional event atomically (row only created after successful upload).

## UI / UX Requirements
- None directly.

## Dependencies
- Features: F0-06 (Identity, organisation and client access schema with RLS), F0-11 (Care events, occurrence overrides and append-only completions)
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-26
- Non-blocking open decisions (proposed defaults apply, confirm when possible): None

## Inputs
- File
- clientId
- eventId?

## Outputs
- Document row
- Signed URL

## Error / Edge Cases
- Upload interrupted → no orphan document row.
- Duplicate filename → allowed; stored under unique document_id path.

## Security / Permissions
- Bucket not public.
- MIME type verified from file signature where feasible, not only extension (PROPOSED).

## Technical Considerations
- Supabase Storage JS client via server action.

## Traceability
- Product requirements: REQ-22 (Files (reports, photos, referrals) can be uploaded, attached to the client or an event, lo…), REQ-N5 (Privacy aligned with Australian Privacy Principles; data download only with family/POA app…), REQ-N6 (Historical records are never lost through edits, rollover, staff changes or organisation c…)
- Sources: BRIEF III, item 6; CIS3 Data Entry 4; FR-4.1–4.3; US C-4; Design: Documents / Documentation file tiles on Edit event, Client Info, Task detail
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
