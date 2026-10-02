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
- Write T-03 (unit), T-04 (component), T-05 (integration), confirm they fail, commit; then the migration.

## Ready for PR
- No.

## Tests written first
- 2026-10-02: T-01, T-02 (`supabase/tests/document_event_linking.test.sql`, 24 assertions). Run against the local stack: fail because `link_document_to_event` does not exist (the script stops at the first `has_function_privilege` call). T-03 to T-05 not written yet.

## Checks run locally (CI down)
- None yet.
