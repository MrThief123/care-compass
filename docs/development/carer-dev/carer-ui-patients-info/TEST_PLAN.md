# Test Plan — CAR-UI-02 Carer Patients and patient info screens (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component**: `src/features/carer-patients/carer-patients.test.tsx` (Vitest + Testing Library + axe). Renders the route files (`page`, `layout`, `loading`) with the `src/server/**` contract mocked, the same pattern as `carer-home.test.tsx`.
- **unit (contract)**: `src/server/shifts/queries.test.ts` (`getCarerPatients` against `src/mocks`).

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | 7 cards in design order; Margaret '78 years · Preston VIC', Jean '88 years · Fairfield VIC' | ☐ | NOT RUN |
| T-02 | AC-02 | component | No patients: 'No patients assigned yet', no search field | ☐ | NOT RUN |
| T-03 | AC-03 | component | Margaret's card is a link to `/carer/patients/client-margaret`; that route redirects to `…/info` | ☐ | NOT RUN |
| T-04 | AC-04 | component | Off shift (Robert): Info has no Edit buttons and no 'Add file' | ☐ | NOT RUN |
| T-05 | AC-05 | component | On shift (Margaret): Info has three Edit buttons and 'Add file' | ☐ | NOT RUN |
| T-06 | AC-06 | component | Search 'je' leaves Jean only; 'zz' leaves no cards and the no-results message | ☐ | NOT RUN |
| T-07 | AC-07 | component | Patient layout: back link, name, meta, four tabs with hrefs, current tab `aria-current` | ☐ | NOT RUN |
| T-08 | AC-08 | component | Home, Calendar and Care log tabs show 'Coming soon' and no buttons | ☐ | NOT RUN |
| T-09 | AC-09 | component | Layout calls `notFound()` for a patient not in the carer's list | ☐ | NOT RUN |
| T-10 | AC-10 | component | Patients and Info reads rejecting: 'Something went wrong' + 'Try again'; log has no client data | ☐ | NOT RUN |
| T-11 | AC-11 | component | Patients and Info `loading.tsx`: status 'Loading', no patient names | ☐ | NOT RUN |
| T-12 | AC-12 | component | axe: populated, empty, error, loading, Info | ☐ | NOT RUN |
| T-13 | AC-13 | unit | `getCarerPatients`: 7 for Aisha in order, `onShift` Margaret only; unknown carer `[]`; carer with only an ended shift `[]` | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite before marking READY FOR PR (`supabase test db` unaffected: no migrations).
- Run Playwright e2e for the carer dashboard with `--grep-invert "F0-07"` (memory: full e2e writes to the hosted project).
- `src/mocks/fixtures.test.ts` and `src/server/shifts/queries.test.ts` (CAR-UI-01) must stay green after the fixture changes.

## Test data
- Component tests build their own rows shaped like `docs/design/screens/carer-02-patients.png`.
- The contract test reads `src/mocks/fixtures.ts`, which gets the design's six other patients' ages and suburbs and a future Aisha shift for each (FD-02).

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
