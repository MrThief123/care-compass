# Progress — F0-27 Delete event

Status: IN PROGRESS (code done, awaiting human review before PR)
Owner: MrThief123
Lane: S — Shared
Branch: `feature/shared-delete-event`
PR target: `main`
Last updated: 2026-10-12

## Blockers
- DEVELOPMENT_PLAN row / CHG entry for F0-27 await human confirmation (§9). Status page not refreshed until then.

## Completed
- Tests first: `delete-actions.test.ts` (7), `event-form-delete.test.tsx` (8); failed before the code (module missing, no button)
- `src/server/events/delete-actions.ts` (`deleteEvent`), mock `deleteEvent`, Delete event button and confirmation in `EventFormScreen`, wired into Family and Carer edit pages (Admin gets none)

## Tests (2026-10-12)
- Unit suite with `DATA_SOURCE=mock NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, integration folder excluded: 249 files, 2843 passed
- With the machine's `.env.local` (DATA_SOURCE=supabase, hosted URL) 19 files fail identically with and without this change (cookies outside request scope)
- NOT run: the Supabase path against a real database (local stack was down). The writes reuse existing policies (override upsert, care_events update), but `recurrence_until` / `is_active` deletion has no pgTAP or e2e test yet.

## HUMAN REVIEW
- "All future" on a series' first occurrence sets `is_active = false`; the series stops from that moment, earlier occurrences stay.
- Cross-lane: `src/features/family-event-form/event-form-screen.tsx`, `src/mocks/queries/events.ts`, Family and Carer edit pages.
