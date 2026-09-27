# Test Plan — F0-13 Client document storage

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration | Given Helen is Margaret's family, when she uploads 'Care plan.pdf' within the allowed size, then a documents row exists and the object is stored under Margaret's path. | ☑ | PASS |
| T-02 | AC-02 | integration | Given an existing document, when Helen requests its URL, then a signed URL is returned that expires. | ☑ | PASS |
| T-03 | AC-03 | integration | Given a file type not in the allowed list, when uploaded, then it is rejected with a plain-language message and nothing is stored. | ☑ | PASS |
| T-04 | AC-04 | db | Given Robert's family member, when they request Margaret's document object, then access is denied. | ☑ | PASS |
| T-05 | AC-05 | integration | Given a document is detached, when documents for the event are listed, then it is excluded but the row and object still exist. | ☑ | PASS |

## Added tests (not in the original plan)
- unit (`src/lib/documents/validate-document.test.ts`): the file-type/size/signature checks `uploadDocument` calls, tested directly without Supabase — 11 cases across AC-01 (each allowed type, a real signature) and AC-03 (disallowed type, signature mismatch, over-size, empty file, blank filename).
- db (`supabase/tests/documents.test.sql`, 43 assertions): `can_access_client_documents` for every role combination; insert/select RLS on `documents`; the mime/size CHECK constraints (defence in depth for AC-03); that only `detached_at` is writable; that `documents` and the `client-documents` bucket cannot be hard-deleted by anyone, including the table owner; the bucket's privacy and size limit; `storage.objects` RLS mirroring the same access.
- integration (`tests/integration/documents.test.ts`): a `DATA_SOURCE=mock` case for all three actions (PRD: mutations are not available against Phase 1 fixtures, the same convention as `changeClientOrganisation`); an unknown/inaccessible document id returns NOT_FOUND rather than an error (AC-02, no enumeration).

T-04 (AC-04, permission) is covered at the db level (`documents.test.sql`): Rosa (another client's family) cannot see or insert into Margaret's row or her Storage folder, in both directions (row and object).
T-05's "documents for the event are listed" is exercised as a direct filtered query on `documents` (`event_id` + `detached_at is null`), since the app-level listing function (`getEventDocuments`) is UI-04's existing contract and its Supabase wiring is a separate, later feature (FAM-08/FAM-09/FAM-15/CAR-04) — F0-13 only proves the column and the row survive detachment correctly.

## Test-writing mistakes found while running these (FD-05)
- `supabase/tests/documents.test.sql`: `has_table('public', 'documents')` silently resolved to the 2-argument `has_table(table, description)` overload — it checked for a table named `public` and used `'documents'` as the description, rather than checking schema `public` for table `documents`. Fixed by supplying an explicit description (the 3-argument form). Two `throws_ok` assertions expected `42501` from an UPDATE/DELETE that instead matches zero rows silently under RLS (an UPDATE/DELETE `USING` clause filters rows before any trigger fires; it doesn't raise for a row a caller cannot see) — rewritten to assert the row is provably unchanged instead. No coverage was lost; if anything the corrected tests assert something more precise.
- `plan()` counts adjusted twice to match the actual assertion count (46 → 43), a miscount each time, not a removed assertion.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
