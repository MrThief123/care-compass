# Progress — F0-26 Custom sections on Client Details (Family, Carer and Admin)

Status: READY FOR PR
Owner: Dhruv Verma
Lane: S — Shared
Sprint: SPRINT
Branch: `feature/shared-client-custom-sections`
PR target: `main`
Last updated: 2026-10-12

## Blockers
- None. Scope confirmed by the human in-session 2026-10-12 (CHG-061). FD-03 limits confirmed 2026-10-12.

## Completed
- Claimed; CHG-061; DEVELOPMENT_PLAN row and card; PRD REQ-11 note; docs pack
- Tests first (T-01 to T-13), confirmed failing for the right reason (33 failed, 3 guards passed); pgTAP failed before the migration (table missing)
- Migration `20261012034310_client_custom_sections.sql`: table, checks, unique title index, 20-section limit trigger, RLS, audit trigger
- `ClientCustomSection` domain type; Robert's mock fixtures and mock read; Margaret's seed rows; regenerated database types
- `getClientCustomSections`, `custom-section-input.ts` rules, add/update/remove Server Actions
- `CustomSections` list, `CustomSectionCard`, `CustomSectionForm`; wired into Family and Carer views and the Family, Admin and Carer Info pages
- e2e spec T-14 `tests/e2e/shared-client-custom-sections.spec.ts`

## Acceptance criteria status
- 16 / 16 MET

## Tests (2026-10-12, local Supabase stack, never the hosted project)
- `npm run verify`: lint 0 errors (3 warnings in files this feature does not touch), typecheck, format, vitest 2826 passed / 243 skipped
- New vitest files: 69 passed (input 13, read 6, actions 21, component 21, pages 8)
- `supabase test db`: 35 files, 971 tests, all pass (new spec 42/42)
- `npm run test:integration`: 21 failed / 219 passed. The same 21 fail with this feature's code stashed (uploads 42P10 on the local storage service, tick-off and auth-audit cases); none touch custom sections. INT-01 and F0-17 AC-04 flake in the full run and pass alone.
- e2e (`E2E_DATA_SOURCE=supabase`) on the new spec plus family-client-info, carer-client-info and admin-client-view: 10 passed, 2 failed. Both failures are file uploads (same local storage problem as above). CAR-04 T-02 failed once under parallel load and passed on its own and on the re-run.
- Real-browser sweep (Playwright, Chrome extension not connected), Helen on Margaret's Client Details: 1920, 1440, 1280, 1024, 768 with no horizontal overflow and no console errors; added a 60-character unbroken title with 300 characters of text (wraps, focus on its heading), confirm and remove, reload shows Description, Habits, Medical history, Communication, Sleep, Documentation.

## HUMAN REVIEW
- Cross-lane edits (FD-06): `src/features/family-info/family-info-view.tsx`, `src/features/carer-patients/carer-info-view.tsx` and the three Info pages.
- New table read by Family, Carer and Admin Client Details.

## Files changed
- Migration, seed, `src/lib/supabase/database.types.ts`, `src/types/domain.ts`, `src/mocks/fixtures.ts`, `src/mocks/queries/clients.ts`
- `src/server/clients/custom-section-input.ts`, `custom-sections.ts`, `custom-section-actions.ts`
- `src/features/client-custom-sections/*`; the two views; three Info pages
- Tests: the five vitest files, the pgTAP spec, the e2e spec
- Docs: DECISIONS.md (CHG-061), DEVELOPMENT_PLAN.md, PRD.md, this pack, status page

## Next action
- Human approval to open the PR "F0-26 Custom sections on Client Details".
