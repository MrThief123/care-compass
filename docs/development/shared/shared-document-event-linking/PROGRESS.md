# Progress — F0-23 Link uploaded documents to a new event

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: S — Shared
Sprint: SPRINT
Branch: `feature/shared-document-event-linking`
PR target: `main`
Last updated: 2026-10-02

## Blockers
- None.

## Dependencies status
- F0-11, F0-13, FAM-08 — MERGED

## Acceptance criteria status
- 0 / 8 MET

## Next action
- Create the migration (`supabase migration new`), make T-01/T-02 pass, then the action and the Add event form.

## Ready for PR
- No.

## Tests written first
- 2026-10-02: T-01, T-02 (`supabase/tests/document_event_linking.test.sql`, 24 assertions). Run against the local stack: fail because `link_document_to_event` does not exist (the script stops at the first `has_function_privilege` call). 
- 2026-10-02: T-03 (`src/server/documents/link-documents.test.ts`, 9 tests), T-04 (`src/features/family-event-form/event-form-add-documents.test.tsx`, 8 tests), T-05 (`tests/integration/document-event-linking.test.ts`, 4 tests, run against the local stack). All fail for the right reason: `linkDocumentsToEvent` does not exist and Add event neither uploads without an event id nor links. Typecheck errors are the same missing export.

## Checks run locally (CI down)
- None yet.
