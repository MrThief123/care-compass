# Session State — CAR-UI-02 Carer Patients and patient info screens (UI)

Last session date: 2026-09-26
Current branch: `feature/carer-ui-patients-info` (from carer-dev at a80db7a, after PR #124)
Worked on: claim, docs (CHG-028), tests first
What changed: feature docs, root DECISIONS CHG-028, DEVELOPMENT_PLAN card note; `src/features/carer-patients/carer-patients.test.tsx`; `getCarerPatients` block in `src/server/shifts/queries.test.ts`
Tests run: `npx vitest run src/features/carer-patients src/server/shifts`
Test results: red as expected (missing routes; `getCarerPatients` missing). CAR-UI-01 shift tests still green.
Current blocker: none
Important decisions: FD-01 split (Info real, Home/Calendar/Care log 'Coming soon'); carer rail + patient tabs; FD-02 contract and fixtures; FD-03 soonest-shift order; FD-04 'Try again' error wording.
Exact next action:
1. `getCarerPatients(carerId)` + `CarerPatientRow` in `src/server/shifts/queries.ts`; mock in `src/mocks/queries/shifts.ts` (now = `REFERENCE_DATE`, age via `ageFromDob`).
2. Fixtures (FD-02): six clients' dob/suburb to design; one future Aisha shift each from Tue 1 Dec in design order; one Daniel shift ended Sun 29 Nov. Check `src/mocks/fixtures.test.ts`.
3. Routes under `src/app/(carer)/carer/patients/`: `page.tsx`, `loading.tsx`, `[clientId]/layout.tsx` (header + tabs, `notFound()`), `[clientId]/page.tsx` (`redirect` to `info`), `info/page.tsx` + `info/loading.tsx` (`FamilyInfoView` via `loadFamilyInfoData`, `canEdit={onShift}`), `home|calendar|tasks/page.tsx` ('Coming soon').
4. Screen components in `src/features/carer-patients/` (grid view with `SearchField` + `PersonCard` in `Link`, tabs, error state, skeletons).
5. Green, full suite, carer e2e (`--grep-invert "F0-07"`), browser check 1920→768, update docs, ask before PR.
Files likely to be touched next: as above
Warning for next session: don't edit `src/features/family-*` or `src/components/shared/**`. Read `node_modules/next/dist/docs/` for layouts, `redirect` and `notFound` before writing routes.
