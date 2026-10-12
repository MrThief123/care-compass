# Test Plan — F0-26 Custom sections on Client Details

## Approach
Tests first (TESTING.md §2); confirm they fail for the right reason before implementing. Unit and component tests with `DATA_SOURCE=mock`; pgTAP for RLS with `supabase test db` against the local stack. Titles start `[F0-26][AC-xx]`.

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-03, AC-08 | unit | Zod schemas: title trim, length, reserved and duplicate titles (any case), text length, 20-section limit | ☑ | FAIL (expected) |
| T-02 | AC-09 | unit | mock `getClientCustomSections`: order, client-scoped, unknown client; mock add, update, remove | ☑ | FAIL (expected) |
| T-03 | AC-09, AC-14 | unit | server actions: validation errors, refusal message passed through, missing section | ☑ | FAIL (expected) |
| T-04 | AC-10, AC-11 | database (pgTAP) | RLS by role (family, carer on and off shift, unassigned carer, own and other org admin, AAL1 admin); audit rows on insert, update, delete | ☑ | FAIL (expected) |
| T-05 | AC-01, AC-07 | component | custom sections listed after built-ins, before Documentation; empty text copy; built-ins have no title field or Remove | ☑ | FAIL (expected) |
| T-06 | AC-02 | component | Add section: form, save, appended, focus on heading | ☑ | FAIL (expected) |
| T-07 | AC-03 | component | validation messages under fields; draft kept | ☑ | FAIL (expected) |
| T-08 | AC-04, AC-05 | component | edit text and title; Cancel restores | ☑ | FAIL (expected) |
| T-09 | AC-06 | component | Remove confirm text, Keep, Remove, focus to Add section | ☑ | FAIL (expected) |
| T-10 | AC-08 | component | at 20 sections Add section replaced by limit note | ☑ | FAIL (expected) |
| T-11 | AC-12 | component | Carer on shift: controls; off shift: read-only, empty hidden | ☑ | FAIL (expected) |
| T-12 | AC-13 | component | Admin Client Details renders custom sections with controls | ☑ | FAIL (expected) |
| T-13 | AC-14, AC-15 | component + axe | refusal message, removed-elsewhere, error state with no PII in log; labels, long text wrap, axe | ☑ | FAIL (expected) |
| T-14 | AC-02, AC-04, AC-06 | e2e (local stack only) | family adds, renames, edits and removes a section; reload persists | ☐ | — |
| T-15 | AC-16 | regression | existing family-info, carer-client-info and admin-client-view suites | ☐ | — |

## Regression scope
`npm run verify`; `supabase test db`; `npm run test:integration`; the e2e spec only against a local Supabase (never the hosted project).

## Test files
- T-01: `src/server/clients/custom-section-input.test.ts`
- T-02: `src/server/clients/custom-sections.test.ts`
- T-03: `src/server/clients/custom-section-actions.test.ts`
- T-04: `supabase/tests/client_custom_sections.test.sql`
- T-05 to T-10, T-13: `src/features/client-custom-sections/custom-sections.test.tsx`
- T-05, T-11, T-12, T-13: `src/features/client-custom-sections/custom-sections-pages.test.tsx`
- T-14 (e2e) and T-15 (regression) come with the implementation.

## Test data
Existing client fixtures; two synthetic custom sections ("Communication", "Behaviours of concern") on the mock client Robert (not Margaret: existing Margaret tests count exactly four cards) and on Margaret in the dev seed.
