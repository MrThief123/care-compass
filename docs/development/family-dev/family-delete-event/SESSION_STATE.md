# Session State — FAM-18 Family — Delete event and recurrence end date

Last session date: 2026-10-11
Current branch: `feature/family-delete-event` (from `main`, pushed, claimed)
Worked on: the whole feature, tests first then implementation.
What changed: `src/server/events/actions.ts` (new `deleteEventOccurrence`; `endDate` on create/update), `src/server/events/queries.ts` (`getEvent` reads `recurrence_until`), `src/mocks/queries/events.ts` (mock delete and end date), `src/features/family-task-detail/delete-event-button.tsx` (new) and `task-detail-view.tsx` (opt-in `canDelete`/`recurring`), `src/features/family-event-form/event-form-screen.tsx` ('Ends'), the Family and Carer task-detail and edit pages (props only), three Family page tests (router mock, FD-08), `tests/integration/family-delete-event.test.ts`.
Tests run: `DATA_SOURCE=mock npx vitest run` (2805 passed), `npm run typecheck`, `npm run lint` (0 errors), prettier on changed files.
Not run: the integration test (Docker down), Playwright, build, browser check. Status page refreshed.
Current blocker: none; human review of the undesigned UI and of FD-02 (Done occurrences not deletable).
Warning for next session: `.env.local` sets `DATA_SOURCE=supabase` to the HOSTED project: run unit tests with `DATA_SOURCE=mock`, and never run Playwright or integration tests without overriding the Supabase variables to the local stack.
Exact next action: start Docker and `supabase start`, run the integration file with local variables, look at Task detail, the dialog and the form in a browser, refresh the status page, then ask the human before opening the PR.
