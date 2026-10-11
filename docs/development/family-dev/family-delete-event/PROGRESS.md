# Progress — FAM-18 Family — Delete event and recurrence end date

Status: IN PROGRESS (implemented; awaiting human review before PR)
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D21
Branch: `feature/family-delete-event` (from `main`)
PR target: `main`
Last updated: 2026-10-11

## Blockers
- None for the code. Before the PR: run `tests/integration/family-delete-event.test.ts` against local Supabase (Docker was not running), run Playwright against LOCAL Supabase only (`.env.local` points at the hosted project), and look at the screens in a browser.
- HUMAN REVIEW: no Figma design for the Delete button, dialog or 'Ends' field (built from tokens, FD-05/FD-06); Done occurrences are not deletable (FD-02).

## Dependencies status
- FAM-06, FAM-07, FAM-15, CAR-07, F0-09, F0-11, UI-02 — MERGED.

## Completed
- Claimed; feature pack; CHG-060
- Tests first (28 written, 27 failing for the right reason), then implementation
- `deleteEventOccurrence` action (mock and Supabase), `endDate` on `createEvent`/`updateEvent`, `getEvent` returns `recurrenceEndDate`
- `DeleteEventButton` + Task detail wiring (Family, on-shift Carer), 'Ends' field on Add/Edit event
- `DATA_SOURCE=mock npx vitest run`: all pass; typecheck, lint clean; prettier clean on changed files

## Not done / not run
- Integration test (needs Docker + local Supabase), Playwright e2e, `npm run build`, browser check
