# Session State — CAR-02 Carer — Notifications card and bell

Last session date: 2026-09-30
Current branch: `feature/carer-notifications`
Worked on: docs rewrite and tests-first
What changed: docs (PRD, ACs, TEST_PLAN, DECISIONS, PROGRESS); failing tests only
Tests run: see PROGRESS.md
Test results: failing for the expected reasons
Current blocker: none
Important discoveries: shifts already have `cancelled_at`; `transfer_client_organisation` cancels future shifts, so the trigger will notify those carers
Important decisions: FD-01 to FD-06 (full name in messages, bell marks all read, bellSlot on PageHeader)
Exact next action: implement to green, then start a preview for the human
Files likely to be touched next: `supabase/migrations/*_carer_notifications.sql`, `src/server/notifications/*`, `src/features/carer-home/notification-bell.tsx`, `src/features/carer-home/carer-home-view.tsx`, `src/components/shared/page-header.tsx`, `src/app/(carer)/carer/layout.tsx`, `src/mocks/fixtures.ts`, `src/mocks/queries/notifications.ts`
Warning for next session: branch is cut from `main`, not from `feature/carer-client-info` (unmerged CAR-04 migration `20260930054637` is not here). Do not open the PR without the human's yes.
