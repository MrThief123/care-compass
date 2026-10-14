# Progress — FAM-18 Family — Delete event and recurrence end date

Status: IN PROGRESS (implemented; awaiting human review before PR)
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D21
Branch: `feature/family-delete-event` (from `main`)
PR target: `main`
Last updated: 2026-10-14

## Blockers
- None for the code. Not yet run: Playwright e2e and a browser check.
- HUMAN REVIEW: no Figma design for the Delete button, dialog or 'Ends' field (built from tokens, FD-05/FD-06); Done occurrences are not deletable (FD-02).
- HUMAN REVIEW: test expectation changed: merging `main` replaced FAM-18's delete action with F0-27's `deleteEvent`; FAM-18's own delete tests were removed or retargeted and a Done guard was added to the shared action (FD-10, FD-11).

## Dependencies status
- FAM-06, FAM-07, FAM-15, CAR-07, F0-09, F0-11, UI-02 — MERGED.

## Completed
- Claimed; feature pack; CHG-062
- Tests first (28 written, 27 failing for the right reason), then implementation
- `deleteEventOccurrence` action (mock and Supabase), `endDate` on `createEvent`/`updateEvent`, `getEvent` returns `recurrenceEndDate`
- `DeleteEventButton` + Task detail wiring (Family, on-shift Carer), 'Ends' field on Add/Edit event
- `DATA_SOURCE=mock npx vitest run`: all pass; typecheck, lint clean; prettier clean on changed files

- 2026-10-14: merged `main`; Delete reuses F0-27's `deleteEvent` with an added Done guard (FD-10); CHG renumbered CHG-062; integration 7/7, unit 2866, pgTAP 971, build clean (TEST_PLAN results)

## Not done / not run
- Playwright e2e, browser check
