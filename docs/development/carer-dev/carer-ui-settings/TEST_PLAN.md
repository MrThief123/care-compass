# Test Plan — CAR-UI-04 Carer Settings screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **unit** → contract test in `src/server/profiles/queries.test.ts` (mock data source)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Settings renders, then 'Aisha Rahman', '0423 987 654', 'aisha.r@banksiahomecare.com.au', 'Registered Nurse' are shown in the My info Name, Phone, Email and Role fields. | ☑ | PASS |
| T-02 | AC-01 | component | My info fields start read-only with an 'Edit' button and no 'Save' (FD-06, PD-054; changed from FD-03). | ☑ | PASS |
| T-03 | AC-02 | component | The Reset card reads "Reset username / password" and "We'll email you a secure link to reset your credentials." with a 'Reset' button. Pressing it announces the local confirmation (FD-03). | ☑ | PASS |
| T-04 | AC-01 | component | A rejected contract read shows the error state. 'Try again' refreshes, and the error message is not logged (PRD Scope, FD-04). | ☑ | PASS |
| T-05 | AC-01 | component | The loading skeleton announces itself as loading and holds no data (PRD Scope, FD-04). | ☑ | PASS |
| T-06 | AC-01 | component | A carer with no phone gets an empty Phone field, not a crash (PRD Scope, FD-04). | ☑ | PASS |
| T-07 | AC-01, AC-02 | component | Populated, error and loading states have no axe violations (REQ-N2). | ☑ | PASS |
| T-08 | AC-01 | unit | `getCarerContactDetails("staff-aisha")` returns Aisha's full name, phone, contact email and role. An unknown id rejects. The fixtures cannot be changed through the result, and a missing phone is left out (FD-01, FD-02). | ☑ | PASS |
| T-09 | AC-01 | component | 'Edit' opens Name, Phone and Email but never Role and focuses Name. Save keeps an edited phone, locks the fields, returns focus to 'Edit' and announces "Saved." (FD-06). | ☑ | PASS |
| T-10 | AC-01 | component | An invalid email on Save shows its message, focuses the field and stays in edit mode. Cancel restores the saved value and hides itself (FD-06). | ☑ | PASS |

Files: T-01 to T-07, T-09 and T-10 in `src/features/carer-settings/carer-settings.test.tsx`. T-08 in `src/server/profiles/queries.test.ts`.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
