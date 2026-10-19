# Progress — F0-29 Tags on events and documents (Task log and Documents filters)

Status: IN PROGRESS
Owner: Shwethan Potu
Lane: S — Shared
Sprint: SPRINT
Branch: `feature/shared-event-document-tags`
PR target: `main`
Last updated: 2026-10-19

## Blockers
- None. Scope given by the human in-session 2026-10-19 (CHG-064).
- Not run: pgTAP T-03 and integration T-08 (Docker not running), browser visual check. Needed before the PR.
- HUMAN REVIEW: no Figma frame for the tag picker, Tag selects or Edit tags dialog; built from the kit and tokens.
- HUMAN REVIEW: test expectation changed: four Task log page tests now expect the event's tags after the task title (FD-07).

## Completed
- Claimed; CHG-064; DEVELOPMENT_PLAN row and card; PL-28; feature pack
- Tests first: T-01–T-08 written; failing for the right reason (TEST_PLAN results)
- Database: `client_tags`, `care_event_tags`, `document_tags`, family-only `set_event_tags` / `set_document_tags`, synthetic seed for Margaret
- Contracts: `TagNamesSchema`, `src/server/tags/` (mock and Supabase), `tags` on `createEvent` / `updateEvent`, `tag` on `getTaskLog`
- Tag picker; Tags on Family Add/Edit event; Task log Tag filter and row tags (Family and Carer); Documents Tags column, Tag filter and Edit tags
- 15 of 16 ACs MET; AC-05 waits on pgTAP (TEST_PLAN results)
