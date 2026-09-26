# Session State: CAR-UI-04 Carer Settings screen (UI)

Last session date: 2026-09-26
Current branch: `feature/carer-ui-settings` (from `carer-dev`)
Worked on: claim, decisions FD-01 to FD-04, tests first
What changed: DECISIONS.md, TEST_PLAN.md, PROGRESS.md. New `src/features/carer-settings/carer-settings.test.tsx`. Appended the `getCarerContactDetails` block to `src/server/profiles/queries.test.ts`.
Tests run: `npx vitest run src/features/carer-settings src/server/profiles/queries.test.ts`
Test results: RED as expected. The component file fails to import `@/app/(carer)/carer/settings/loading`, and the 4 contract cases fail on `getCarerContactDetails is not a function`. The existing family cases still pass.
Current blocker: none
Important decisions: FD-01 (edit the staff-aisha fixture: phone 0423 987 654, email aisha.r@banksiahomecare.com.au), FD-02 (new contract), FD-03 (My info read-only, no Edit/Save; Reset only announces "We've emailed you a link to reset your password." in role=status)
Exact next action: implement.
1. Update the `staff-aisha` fixture (FD-01). Fix any test that asserts the old email and record it in DECISIONS.md.
2. Add `CarerContactDetails` and `getCarerContactDetails` to `src/mocks/queries/profiles.ts` (built from `CARER_PROFILES`, with role = jobTitle). Add the matching server contract function and its Supabase branch to `src/server/profiles/queries.ts`.
3. Add `src/app/(carer)/carer/settings/page.tsx` (async; `getCurrentUser("carer")` then the contract; on a rejected read it logs the error class only and returns the error state) and `loading.tsx`.
4. Add `src/features/carer-settings/`: the view (`CardShell` + kit `Field` readOnly ×4, `SettingsActionCard` Reset, a status region), a skeleton, and an error state. Reuse or copy CarerHomeErrorState ('Try again').
Files likely to be touched next: those listed above.
Warning for next session: do not edit `src/components/shared/**`. Flag the two `src/mocks/**` edits and the `src/server/profiles` edit in the PR. Make no Save/Edit controls (CAR-09 adds them).
