# Progress — FAM-13 Family — Change organisation

Status: MERGED TO DEV
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D11
Branch: `feature/family-change-organisation` (created from `origin/family-dev` at 9f4de15)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None. Blocking decisions are ANSWERED in DECISIONS.md (FAM-12: OQ-35; FAM-13: OQ-06, OQ-15).

## Dependencies status
- F0-06 — MERGED TO DEV
- F0-10 — MERGED TO DEV
- FAM-UI-06 — MERGED TO DEV

## Completed
- Tests first (T-01 to T-06 plus supporting tests), then implementation, 2026-09-25 (commits `test(family): …`, `feat(family): …`).
- Migration `20260925020000_transfer_client_organisation.sql`: `transfer_client_organisation` and `list_organisations_for_transfer` (FD-01, FD-03, FD-04).
- `src/server/clients/`: `changeClientOrganisation` action, `getOrganisationChoices` contract (mock and Supabase).
- Settings screen: organisation picker, then the destructive confirmation, then the change with success and failure states (FD-02).

## In progress
- None

## Remaining
- Human review, then PR (needs the human's approval to open it).
- When F0-11, F0-12 and F0-13 merge: extend the pgTAP AC-03 counts to events, budget entries, documents and completions (FD-05).

## Acceptance criteria status
- 6 / 6 MET (AC-01 to AC-06); AC-03 for the tables that exist today (FD-05)

## Tests
- Written: 6 / 6 planned (T-01 to T-06) plus supporting tests: pgTAP 26, server 11, component 17, integration 3
- Passing: all. `supabase test db`: 66 (5 files). `npx vitest run src/features/family-settings src/server/clients`: 5 files, 80 tests. `tests/integration/family-change-organisation.test.ts` against the local stack: 3 (with FAM-12's 4, 7 pass)
- Failing: 0. Full `npm run test` (default env): 1723 passed, 7 skipped (the local-only integration tests)

## Files changed
- `supabase/migrations/20260925020000_transfer_client_organisation.sql`, `supabase/tests/transfer_client_organisation.test.sql` (Lane B folder, FD-01)
- `src/lib/supabase/database.types.ts` (two function types)
- `src/server/clients/`: `actions.ts`, `queries.ts`, `actions.test.ts`
- `src/mocks/fixtures.ts`, `src/mocks/queries/clients.ts` (Lane S, FD-06)
- `src/features/family-settings/`: `family-settings-view.tsx`, `organisation-choices.tsx`, `change-organisation.test.tsx`, `family-settings.test.tsx` (helpers, FD-07)
- `src/app/(family)/family/[clientId]/settings/page.tsx`
- `tests/integration/family-change-organisation.test.ts`
- This feature's docs

## Decisions
- FD-01 functions from Lane F (HUMAN REVIEW); FD-02 picker flow (design review); FD-03 list is a function; FD-04 shifts and assignments; FD-05 AC-03 on current tables (HUMAN REVIEW); FD-06 mock mode and Lane S fixtures (HUMAN REVIEW); FD-07 FAM-UI-06 helpers changed (HUMAN REVIEW); FD-08 defaults and wording.

## Problems encountered
- `.env.local` points at a hosted Supabase project (see FAM-12 PROGRESS). This feature's integration test runs only against a local URL; run it with the three variables from `supabase status -o env`. **The FAM-13 migration is applied to the local database only.**
- The local database holds leftover organisations from F0-07's integration tests (they never delete theirs), so the pgTAP listing test looks only at its own two organisations.
- Zod's `z.uuid()` rejects seed-style ids (no RFC variant bits); the action uses `z.guid()`.
- One earlier run of `day-timeline.test.tsx` failed and later passed with no change (time-of-day dependent); not touched.

## Assumptions
- The in-progress shift is ended at now() (the PRD's PROPOSED default, FD-04).

## Next action
- Human reviews (migration, AC-03 scope, picker design and wording, test helper changes), then approves opening the PR to `family-dev`.

## Ready for PR
- No
