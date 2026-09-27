# Progress — CAR-UI-02 Carer Patients and patient info screens (UI)

Status: IN REVIEW
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D4–D5
Branch: `feature/carer-ui-patients-info`
PR target: `carer-dev` · PR #125
Last updated: 2026-09-26 (CHG-029 implemented, green)

## Blockers
- None. Lane F request (FD-01) blocks only CAR-04's wiring of the Home, Calendar and Care log tabs, not this feature.

## Dependencies status
- F0-15 — MERGED · UI-03 — MERGED · CAR-UI-01 (PR #124) — MERGED to carer-dev

## Completed
- Claimed (2026-09-26).
- Docs updated for CHG-026 and CHG-028 (human answers 2026-09-26: split scope; carer rail + patient tabs; branch from carer-dev after #124 merged): PRD Scope, 13 ACs, TEST_PLAN, FD-01 to FD-04, root DECISIONS CHG-028, DEVELOPMENT_PLAN card note.
- Tests written first: `src/features/carer-patients/carer-patients.test.tsx` (component, T-01 to T-12) and `getCarerPatients` block in `src/server/shifts/queries.test.ts` (T-13). Red run 2026-09-26: component file fails to resolve `@/app/(carer)/carer/patients/[clientId]/calendar/page` (routes not built); contract tests fail with `getCarerPatients is not a function`. Both expected.

- Implemented (2026-09-26): `getCarerPatients` contract + mock; fixtures (FD-02); routes under `src/app/(carer)/carer/patients/`; screen components in `src/features/carer-patients/`.
- Suite (2026-09-26, run locally; CI not triggered): lint 0 errors (3 warnings: 2 pre-existing, 1 on unused holding-tab props by design, FD-05); `tsc` clean; prettier clean on tracked files; vitest 1861 passed, 5 failed: F0-04/F0-07 integration tests get `AuthApiError: Invalid API key` from the Supabase project in `.env.local` (environment, no auth code touched). Playwright `--grep-invert "F0-07"`: 36/36 passed.
- Browser check (Playwright/Chromium against the dev server) at 1920, 1600, 1440, 1280, 1024, 900, 768: no horizontal scroll, no overlapping elements; grid 4 → 3 → 2 columns; search 'je' → Jean only; clicking Margaret opens her Info with 3 Edit buttons; Robert's Info has none.

## In progress
- None

## CHG-029 (human review of the preview, 2026-09-26)
- Home landing, tab order Home · Info · Calendar · Care log, off-shift 'View only' notice on Info, 'On shift · can edit' / 'View only' labels on Patients cards. Docs: PRD, AC-03/AC-07 reworded, AC-14/AC-15, T-14/T-15, FD-06, root CHG-029.
- Red run 2026-09-26: 4 failing as expected (redirect still `…/info`, old tab order, no notice, no card labels). Green after implementing (`edit-status.tsx`, tab order, redirect, Info notice).
- **HUMAN REVIEW: test expectation changed** — T-03 (redirect `…/info` → `…/home`) and T-07 (tab order), FD-06.
- Suite (run locally; CI not triggered): feature 34/34; lint 0 errors (same 3 warnings); `tsc` clean; prettier clean; full vitest 1864 passed, 7 failed: the same 5 F0-04/F0-07 `Invalid API key` failures plus FAM-UI-07 generated-rows and UI-00 import-boundary timing out under full-suite load (both pass when re-run alone: 44/44). Playwright `--grep-invert "F0-07"`: 36/36.
- Browser check at 1920 → 768: no horizontal scroll, no overlaps; badges sit top-right of each card; Margaret opens on Home with tabs Home | Info | Calendar | Care log; Robert's Info shows the notice.

## Remaining
- Review and merge of PR #125 (human).

## Acceptance criteria status
- 13 / 13 MET

## Tests
- Written: 13 / 13 test IDs (37 cases)
- Passing: all (29 component + 5 contract; fixtures tests green)
- Failing: none in this feature

## Files changed
- `src/server/shifts/queries.ts`, `src/mocks/queries/shifts.ts`, `src/mocks/fixtures.ts`, `src/mocks/fixtures.test.ts` (HUMAN REVIEW, FD-05)
- `src/app/(carer)/carer/patients/**` (page, loading, `[clientId]` layout/page, info page+loading, home/calendar/tasks)
- `src/features/carer-patients/*` (view, skeleton, header, tabs, coming-soon, find-patient, patient-meta)
- Test type fixes: `carer-patients.test.tsx`, `src/server/shifts/queries.test.ts` (FD-05)

## Decisions
- See DECISIONS.md (FD-01 to FD-05). HUMAN REVIEW in PR: `src/mocks/**` edited from Lane C (FD-02); **HUMAN REVIEW: test expectation changed** (`fixtures.test.ts` Robert dob/suburb, FD-05).

## Problems encountered
- None

## Next action
- Ask the human before opening the PR.

## Ready for PR
- Yes (awaiting approval)
