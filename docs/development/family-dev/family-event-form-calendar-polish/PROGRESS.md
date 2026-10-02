# Progress — FAM-16 Family — Event form and calendar polish

Status: READY FOR PR
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D18
Branch: `feature/family-event-form-calendar-polish`
PR target: `main`
Last updated: 2026-10-02 (implemented, all 11 ACs MET, browser-checked)

## Blockers
- None. No open decisions; the human approved scope and the end-time rules in-session on 2026-10-02.
- For the human in the PR: FD-02 (flagged Lane S edit to `DatePickerGrid` and `EventForm`), design gap (OQ-19, built from tokens).
- **HUMAN REVIEW: test expectation changed** (FD-05): event-details, event-details-fields, CAR-07 T-04, task-log-view helper, Family tasks page test.

## Dependencies status
- FAM-06, FAM-07, FAM-14, FAM-15, CAR-07, UI-01, UI-02 — MERGED to main.

## Completed
- Claimed; CHG-051; docs pack; tests first (failing for the right reason), then implementation
- Late note (`late-completion.ts`) on Task detail and the Log; today ring and month follow in the date picker; Start and End time in the event form (Family and Carer)
- Local suites, integration and e2e regression, real-browser sweep 1920 to 768

## In progress
- None

## Remaining
- Human review of the PR; merge by the human

## Acceptance criteria status
- 11 / 11 MET

## Tests
- `DATA_SOURCE=mock npx vitest run`: 2488 passed, 0 failed (baseline 2463). Lint 0 errors, typecheck and format clean. Integration 28/28, e2e 29/29 on the local stack. See TEST_PLAN.md "Results".
- CI is down: all of this was run locally.

## Files changed
- Production: `src/features/family-task-log/late-completion.ts` (new), `task-log-table.tsx`, `src/features/family-task-detail/task-detail-view.tsx`, `src/features/family-event-form/event-details.ts`, `event-details-fields.tsx`, `event-form-screen.tsx` (comment), Lane S: `src/components/shared/calendar/date-picker-grid.tsx`, `src/components/shared/forms/event-form.tsx`
- Tests: see DECISIONS FD-05 and TEST_PLAN.md
- Docs: this folder, root DECISIONS.md (CHG-051), PRD.md (PL-27), DEVELOPMENT_PLAN.md, status page

## Decisions
- See DECISIONS.md and root CHG-051

## Problems encountered
- `.env.local` sets `DATA_SOURCE=supabase`, which makes 150 mock-based unit tests fail (FD-01); symlinked node_modules breaks Turbopack (FD-06).

## Assumptions
- Planned day D18 (not asked of the human).

## Next action
- Human reviews the PR.

## Ready for PR
- Yes
