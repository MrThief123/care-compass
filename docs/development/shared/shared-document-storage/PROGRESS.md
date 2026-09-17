# Progress — F0-13 Client document storage

Status: NOT STARTED
Owner: unclaimed
Lane: B — Backend
Sprint: SPRINT · planned D6–D7
Branch: `feature/shared-document-storage` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work
- OQ-26 — File upload constraints

## Dependencies status
- F0-06 — NOT STARTED
- F0-11 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Private storage bucket `client-documents`; object path `clients/{client_id}/{document_id}/{filename}`.
- `documents` table: id, client_id, event_id null, storage_path, filename, mime_type, size_bytes, uploaded_by, uploaded_at, detached_at null.
- Storage RLS mirroring `documents` row access.
- Server action `uploadDocument(clientId, file, eventId?)` validating type and size (limits per OQ-26).
- Server function `getDocumentUrl(documentId)` returning a short-lived signed URL (PROPOSED 60 s).
- No hard delete: `detachDocument` sets detached_at (perpetual retention, CIS3).

## Acceptance criteria status
- 0 / 5 MET

## Tests
- Written: 0 / 5
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `supabase/migrations/*_documents.sql`, `supabase/tests/documents.test.sql`, `src/server/documents/actions.ts`, `src/server/documents/queries.ts`, `tests/integration/documents.test.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01, OQ-26; then complete dependencies, run START FEATURE F0-13, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
