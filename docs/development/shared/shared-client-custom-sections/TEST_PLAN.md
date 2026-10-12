# Test Plan — F0-26 Custom sections on Client Details

## Approach
Tests first (TESTING.md §2); confirm they fail for the right reason before implementing. Unit and component tests with `DATA_SOURCE=mock`; pgTAP for RLS with `supabase test db` against the local stack. Titles start `[F0-26][AC-xx]`.

## Test cases
| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-03, AC-08 | unit | Zod schemas: title trim, length, reserved and duplicate titles (any case), text length, 20-section limit | ☐ | — |
| T-02 | AC-09 | unit | mock `getClientCustomSections`: order, client-scoped, unknown client; mock add, update, remove | ☐ | — |
| T-03 | AC-09, AC-14 | unit | server actions: validation errors, refusal message passed through, missing section | ☐ | — |
| T-04 | AC-10, AC-11 | database (pgTAP) | RLS by role (family, carer on and off shift, unassigned carer, own and other org admin, AAL1 admin); audit rows on insert, update, delete | ☐ | — |
| T-05 | AC-01, AC-07 | component | custom sections listed after built-ins, before Documentation; empty text copy; built-ins have no title field or Remove | ☐ | — |
| T-06 | AC-02 | component | Add section: form, save, appended, focus on heading | ☐ | — |
| T-07 | AC-03 | component | validation messages under fields; draft kept | ☐ | — |
| T-08 | AC-04, AC-05 | component | edit text and title; Cancel restores | ☐ | — |
| T-09 | AC-06 | component | Remove confirm text, Keep, Remove, focus to Add section | ☐ | — |
| T-10 | AC-08 | component | at 20 sections Add section replaced by limit note | ☐ | — |
| T-11 | AC-12 | component | Carer on shift: controls; off shift: read-only, empty hidden | ☐ | — |
| T-12 | AC-13 | component | Admin Client Details renders custom sections with controls | ☐ | — |
| T-13 | AC-14, AC-15 | component + axe | refusal message, removed-elsewhere, error state with no PII in log; labels, long text wrap, axe | ☐ | — |
| T-14 | AC-02, AC-04, AC-06 | e2e (local stack only) | family adds, renames, edits and removes a section; reload persists | ☐ | — |
| T-15 | AC-16 | regression | existing family-info, carer-client-info and admin-client-view suites | ☐ | — |

## Regression scope
`npm run verify`; `supabase test db`; `npm run test:integration`; the e2e spec only against a local Supabase (never the hosted project).

## Test data
Existing client fixtures; two synthetic custom sections ("Communication", "Behaviours of concern") added to the mock and seed data.
