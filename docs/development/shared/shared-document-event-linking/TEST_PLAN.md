# Test Plan — F0-23 Link uploaded documents to a new event

## Approach
Tests first (TESTING.md §2); confirm each fails for the expected reason before implementing. Test titles start `[F0-23][AC-xx]`.

## Test levels used
- **pgTAP** → `supabase/tests/document_event_linking.test.sql` (24 assertions), run with `supabase test db supabase/tests/document_event_linking.test.sql` on the local stack (same fixtures as `documents.test.sql`)
- **unit** → Vitest, stubbed Supabase client (`src/server/documents/link-documents.test.ts`)
- **component** → Vitest render of the Add event form (`src/features/family-event-form/event-form-add-documents.test.tsx`)
- **integration** → local Supabase, `describe.skipIf(!hasLocalSupabase)` (`tests/integration/document-event-linking.test.ts`)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01, AC-03, AC-04 | pgTAP | Uploader links own unlinked document to a same-client event; `event_id` set, other columns and storage path unchanged; audit row written; second link, detached document, other client's event, unknown ids all raise. | ☑ | FAIL (expected): `link_document_to_event` does not exist |
| T-02 | AC-02, AC-05 | pgTAP | Another family, unassigned carer, other-organisation admin and a signed-out caller are refused; a user with client access who is not the uploader is refused; `anon` has no execute grant. | ☑ | FAIL (expected): `link_document_to_event` does not exist |
| T-03 | AC-06, AC-07 | unit | `linkDocumentsToEvent`: validates ids, calls the function per id, reports failed ids without stopping, `NOT_AVAILABLE` in mock mode, no PII in the error. | ☐ | |
| T-04 | AC-06, AC-07, AC-08 | component | Add event: picker opens, tile appears, save calls `createEvent` then `linkDocumentsToEvent`; partial failure message names the file and the event still opens; no "Save the event first" text; Edit mode unchanged. | ☐ | |
| T-05 | AC-01, AC-06 | integration | Real Helen and Margaret: upload with no event, `createEvent`, `linkDocumentsToEvent`, the event's documents list includes the file; Rosa cannot link Helen's upload. | ☐ | |

## Regression scope
`src/server/documents`, `src/features/family-event-form`, `src/features/family-info`, `src/app/(family)/family/[clientId]/events`, `supabase/tests/documents.test.sql`, full unit suite, pgTAP suite, typecheck, lint.

## Test data
Synthetic users only, as `supabase/tests/documents.test.sql` and `tests/integration/documents.test.ts` create.

## Coverage mapping rule
Every AC has at least one test.
