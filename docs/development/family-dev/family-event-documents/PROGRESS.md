# Progress — FAM-08 Family — Event documents (file tiles)

Status: IN PROGRESS
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D10
Branch: `feature/family-event-documents`
PR target: `main` (CHG-036; `family-dev` is retired)
Last updated: 2026-10-01

## Blockers
- None — OQ-26 ANSWERED

## Dependencies status
- F0-13 — MERGED TO DEV
- FAM-UI-03 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- File tiles showing file icon + filename; clicking opens a signed URL in a new tab.
- '+ Add file' tile opening the file picker; upload progress; error on invalid type/size.
- Documents attached on save of Add/Edit event; listed read-only on Task detail (FAM-15 displays via shared component).

## Acceptance criteria status
- 0 / 3 MET

## Tests
- Written: 0 / 3
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/components/shared/document-tiles.tsx`, `src/server/documents/actions.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-26; then complete dependencies, run START FEATURE FAM-08, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
