# Test Plan — FAM-UI-06 Family Settings screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Test titles start `[FAM-UI-06][AC-xx]`; contract tests use `[FAM-UI-06][CHG-023]`.

## Test levels used
- **unit** → contract and fixture tests in `src/server/profiles/queries.test.ts` (the fixture check sits there too, so no separate `src/mocks/queries/profiles.test.ts`), plus the Zod schema (`src/features/family-settings/*.test.ts`)
- **component** → `src/features/family-settings/family-settings.test.tsx` (Vitest + Testing Library + axe). Following FAM-UI-04, render the view component with data from the contract (or a hand-built object for edge cases), not the async page.
- No Playwright: no AC says e2e (docs/AGENT_REFERENCE.md). The width sweep is a manual real-browser check (FD-06).

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given the contract data for `profile-helen`, when the view renders, then 'Family info' shows inputs Name 'Helen Doyle', Phone '0412 345 678', Email 'helen@example.com', Address '12 Wattle St, Preston VIC 3072', in that order. The heading 'Settings' is shown. | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-02 | AC-02 | component | The Change organisation card reads 'Currently registered with Banksia Home Care.'. Click 'Change': a `dialog` named 'Change organisation?' has the FD-04 body with 'Margaret' and 'Banksia Home Care will lose access immediately', and buttons 'Cancel' and 'Change organisation'. | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-03 | AC-03 | component | Test each of Cancel, the close X and Escape: the dialog is gone, focus is on 'Change', the live region is empty and the card text is unchanged. | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-04 | AC-04 | component | Confirm 'Change organisation': the dialog is gone, the live region reads 'Choosing a new organisation is not available yet.' and the card still names Banksia Home Care. | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-05 | AC-05 | component | The Reset card reads 'Reset username / password' and 'We'll email you a secure link to reset your credentials.'. Click 'Reset': the live region reads "We've emailed you a link to reset your password." and contains no '@'. | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-06 | AC-06 | component | Change Phone to '0400 000 000' and click Save: the field keeps the value and 'Saved.' is announced. Unmount and render again: Phone is '0412 345 678'. | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-07 | AC-07 | component | Save with Name blank, Email 'helen@' and Phone 'abc': the three FD-03 messages show, each input has `aria-invalid="true"` and `aria-describedby` pointing at its message, focus is on Name, and 'Saved.' is not announced. Then fix the fields and Save: the errors clear. | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-08 | AC-07 | unit | The settings schema accepts blank Phone, Email and Address; accepts '0412 345 678', '+61 412 345 678' and '(03) 9123 4567'; rejects 'abc' and '123'; trims values. | ☑ | RED 2026-09-25 (missing module, `settings-schema.test.ts`) |
| T-09 | AC-08 | component | Contact details with no phone or address render empty inputs. A header summary with no `organisationName` shows 'Not registered with an organisation.' and no 'Change' button. | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-10 | AC-08 | component | The error state renders the shared ErrorState with a 'Retry' button (the settings error component). The skeleton renders one labelled status. | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-11 | AC-09 | component | axe finds no violations on the screen or with the dialog open. With a 200-character name and address, the inputs hold the full value and the card has no overflow classes that break the layout (layout itself is checked in the browser sweep). | ☑ | RED 2026-09-25 (missing module, `family-settings.test.tsx`) |
| T-12 | CHG-023 | unit | `getFamilyContactDetails('profile-helen')` returns `{ profileId, name: 'Helen Doyle', phone: '0412 345 678', email: 'helen@example.com', address: '12 Wattle St, Preston VIC 3072' }`. An unknown id rejects. A profile without phone or address leaves those keys out. Supabase mode throws the not-implemented error. Changing the result does not change the fixtures. | ☑ | RED 2026-09-25 (missing module, `src/server/profiles/queries.test.ts`) |

## Red run (2026-09-25, tests written first)
37 cases in 3 files: `src/server/profiles/queries.test.ts` (6), `src/features/family-settings/settings-schema.test.ts` (13), `src/features/family-settings/family-settings.test.tsx` (18). All three files fail at import, before any test runs, because the modules they import do not exist yet: `@/server/profiles/queries`, `@/features/family-settings/settings-schema`, `@/features/family-settings/family-settings-view`, `@/features/family-settings/settings-error-state` and `@/app/(family)/family/[clientId]/settings/loading`. `tsc --noEmit` reports only those missing modules; ESLint is clean. AC-09's 44×44px targets and the 200-character layout are checked in the real-browser sweep (FD-06), not in jsdom.

## Regression scope
- Run the full unit/component suite, `npm run lint`, `npm run typecheck` and `npm run build` before marking READY FOR PR. `supabase test db` is not affected (no migration), but run it if local Supabase is up. CI is down (Actions limits): run the checks locally and say so in the PR.
- Run the family e2e specs with `--grep-invert "F0-07"` (the F0-07 specs write to the hosted project).
- Real-browser check at `/family/<clientId>/settings` from 1920 down to 768 wide (FD-06), with a side-by-side against `docs/design/screens/family-05-settings.png`.

## Test data
- Mock fixtures (`src/mocks/fixtures.ts`): client Margaret, organisation Banksia Home Care, `profile-helen` with the CHG-023 values. Edge-case tests build their own objects.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
