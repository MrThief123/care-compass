# Test Plan — INT-12 Cross-role integration journey

## Approach
Tests are written **before** any fix or helper code (TESTING.md §2). This feature tests merged code, so a new test may pass on its first run; record the first-run result either way. A first run that fails is triaged: a test bug is fixed in the spec; a product defect is recorded (AC-44), the test is marked `test.fail()` with the defect ID, and the human is told.

Work one phase at a time: write that phase's spec, run it, walk it through in Chrome, record results in PROGRESS.md, commit, then ask the human before starting the next phase.

## Test levels used
- **e2e** → `tests/e2e/int-12/phase-<n>-<name>.spec.ts` (Playwright, real browser, local Supabase)
- **review** → manual Chrome walkthrough with screenshots in `evidence/`

## Run commands
```bash
# Local stack only. Never use .env.local (hosted project).
eval "$(supabase status -o env | sed 's/^/export /')"   # API_URL, ANON_KEY, SERVICE_ROLE_KEY
export NEXT_PUBLIC_SUPABASE_URL=$API_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
npx next build
E2E_PORT=3150 E2E_DATA_SOURCE=supabase npm run test:journey                 # all phases
E2E_PORT=3150 E2E_DATA_SOURCE=supabase npm run test:journey -- --grep @phase-3   # one phase
```

## Test cases

| Test ID | Covers | Phase | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|---|
| T-01 | AC-01 | 0 | e2e | With a hosted URL or the mock data source, every INT-12 test reports skipped with the reason. | ☐ | — |
| T-02 | AC-02 | 0 | e2e | After a phase that passes and one forced to fail, a service-role query finds no rows with the run marker. | ☐ | — |
| T-03 | AC-03 | 0 | e2e | `test:journey --list` shows phases in order; `--grep @phase-2` runs only Phase 2. | ☐ | — |
| T-04 | AC-04 | 1 | e2e | Family sign-up lands on the client's Home; sign out and in returns there. | ☐ | — |
| T-05 | AC-05 | 1 | e2e | Organisation sign-up, TOTP enrolment from the shown secret, Admin Home; second sign-in asks for a code only. | ☐ | — |
| T-06 | AC-06 | 1 | e2e | Wrong code: error, cleared field, stays on code step; `/admin/*` before a code goes back to the code step. | ☐ | — |
| T-07 | AC-07 | 1 | e2e | Admin adds carer; invite read from Inbucket; set password; Carer Home; sign in again. | ☐ | — |
| T-08 | AC-08 | 1 | e2e | `/sign-up` offers only Family and Organisation; no carer or join-organisation path. | ☐ | — |
| T-09 | AC-09 | 1 | e2e | Reset for each role via its own entry point; old password refused, new accepted; admin still asked for a code. | ☐ | — |
| T-10 | AC-10 | 1 | e2e | Reused reset link offers a new link and leaves the password unchanged. | ☐ | — |
| T-11 | AC-11 | 1 | e2e | Same message for wrong password and unknown email; each role sent home from the other roles' URLs. | ☐ | — |
| T-12 | AC-12 | 2 | e2e | Day, week, month views place seeded events on the right Melbourne date and time; Previous, Next, Today. | ☐ | — |
| T-13 | AC-13 | 2 | e2e | One-off and weekly $40.00 events show on the right dates, the weekly one 4 and 52 weeks on; budget unchanged. | ☐ | — |
| T-14 | AC-14 | 2 | e2e | Clicking an event opens Task detail with all fields. | ☐ | — |
| T-15 | AC-15 | 2 | e2e | Edit title, time, cost; calendar and Task detail updated; earlier completion unchanged in Task log. | ☐ | — |
| T-16 | AC-16 | 2 | e2e | Upload a document; tile shows and opens. | ☐ | — |
| T-17 | AC-17 | 2 | e2e | Budget matches seed; Update funds +$500.00; totals and "Recorded by Helen Carter". | ☐ | — |
| T-18 | AC-18 | 2 | e2e | Phone and Habits changes persist after leaving and returning. | ☐ | — |
| T-19 | AC-19 | 3 | e2e | Family-created event seen by the carer on shift and the admin client view. | ☐ | — |
| T-20 | AC-20 | 3 | e2e | Family edit and delete seen by carer and admin. | ☐ | — |
| T-21 | AC-21 | 3 | e2e | Family top-up seen in the admin client view with the family's name. | ☐ | — |
| T-22 | AC-22 | 3 | e2e | Habits and phone changes seen by carer and admin. | ☐ | — |
| T-23 | AC-23 | 3 | e2e | Family document seen and opened by carer and admin; carer has a 'family' notification. | ☐ | — |
| T-24 | AC-24 | 4 | e2e | Admin assigns shift: carer notification and Calendar block; family sees the carer on that slot. | ☐ | — |
| T-25 | AC-25 | 4 | e2e | Admin-made costed event seen by family and carer. | ☐ | — |
| T-26 | AC-26 | 4 | e2e | Admin edit and tick seen by family and carer, named "Priya Shah". | ☐ | — |
| T-27 | AC-27 | 4 | e2e | Admin top-up seen by family with "Recorded by Priya Shah". | ☐ | — |
| T-28 | AC-28 | 4 | e2e | Admin cancels the only future shift: carer loses shift and patient; family loses the assignment. | ☐ | — |
| T-29 | AC-29 | 4 | e2e | Deactivated carer: no sign-in, gone from active lists and future tasks; past completions keep the name. | ☐ | — |
| T-30 | AC-30 | 4 | e2e | Staff, Clients and Manage pairings agree; Admin Home counts equal list rows. | ☐ | — |
| T-31 | AC-31 | 4 | e2e | Admin removes client: gone from admin and carer lists, shifts cancelled, family sees the removal banner. | ☐ | — |
| T-32 | AC-32 | 5 | e2e | Carer Patients lists only the client with shifts; the other client's URL is not-found. | ☐ | — |
| T-33 | AC-33 | 5 | e2e | Before and between shifts: controls absent; a completion insert with the carer's session is refused. | ☐ | — |
| T-34 | AC-34 | 5 | e2e | Carer tick seen by family on Home, Calendar, Task log and by admin; Overdue cleared for both. | ☐ | — |
| T-35 | AC-35 | 5 | e2e | Costed tick deducts exactly $40.00 once for family and admin; next weekly occurrence charges again; no double charge. | ☐ | — |
| T-36 | AC-36 | 5 | e2e | Over-balance tick held pending for both; family top-up pays it; both see new remaining. | ☐ | — |
| T-37 | AC-37 | 5 | e2e | Carer-added and carer-edited events seen by family and admin. | ☐ | — |
| T-38 | AC-38 | 5 | e2e | Carer phone change seen on admin Staff panel; name and role not editable. | ☐ | — |
| T-39 | AC-39 | 6 | e2e | Organisation change: old admin and carer lose the client; new admin gains it; history intact for family and new admin. | ☐ | — |
| T-40 | AC-40 | 7 | e2e | Threshold email to family and admin only, once; naming client and bucket. | ☐ | — |
| T-41 | AC-41 | 7 | e2e | Pending-cost email to family and admin only, once, with the approved sentence. | ☐ | — |
| T-45 | AC-45 | 8 | e2e | On every screen of each dashboard, with first names shared across people, every displayed person name, the client's included (Family Home header and greeting too), is first and last name; a bare first name fails. | ☐ | — |
| T-42 | AC-42 | 8 | e2e | Three consecutive full runs green; no leftover rows. | ☐ | — |
| T-43 | AC-43 | 8 | review | Chrome walkthrough per phase; no console errors; screenshots saved. | ☐ | — |
| T-44 | AC-44 | 8 | review | Defects listed with repro steps and raised with the human. | ☐ | — |

## Regression scope
- Before READY FOR PR: `npm run lint`, `npx tsc --noEmit`, `npm test`, `supabase test db`, and the existing cross-role e2e specs (`admin-rostering`, `carer-care-delivery`, `organisation-transfer`, `shared-cross-role-sync`) on the same local stack.

## Test data
- Synthetic people created per run (see ACCEPTANCE_CRITERIA.md); never the hosted project; never `.env.local`.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
