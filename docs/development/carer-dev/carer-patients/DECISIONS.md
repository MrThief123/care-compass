# Decisions — CAR-03 Carer — Patients

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-09 | Carer access model | YES | ANSWERED (PD-041; read access follows shifts, CHG-027). |

## Feature decisions log

### FD-01 — Docs rewritten; search is server-side through `?q=`
- Date: 2026-09-29
- Context: the generated PRD and ACs said "assigned clients", first-name 'Margaret' and search 'Eld'. Since then CHG-027 made access follow shifts, CHG-032 made displayed names full, and CAR-UI-02 built a local first-name filter although the PRD says server-side (D32).
- Decision: PRD Scope, ACs (AC-01 to AC-08), TEST_PLAN and USER_STORIES rewritten before any code. Search is the URL's `?q=` answered by `getCarerPatients(carerId, query?)`, as Family's Care log does; cards show the full name.
- Reason: follows the controlled PRD (no CHG needed) and CHG-032.
- Human confirmation: Dhruv Verma, 2026-09-29 (in-session): server-side search, full names.

### FD-02 — AC-02 typo: 'Eld' becomes 'Els'
- Date: 2026-09-29
- Context: no client among the seven has 'eld' in a first or last name (Elsie Marsh), so the criterion could never pass.
- Decision: search 'Els' returns only Elsie Marsh. Recorded as a misread-requirement fix before implementation.
- Human confirmation: Dhruv Verma, 2026-09-29 (in-session).

### FD-03 — Existing CAR-UI-02 tests changed — HUMAN REVIEW: test expectation changed
- `carer-patients.test.tsx` [CAR-UI-02][AC-06] ×3 (type 'je', type 'MARG', type 'zz', all local filtering): removed. Reason: recorded requirement change (FD-01); replaced by [CAR-03][AC-02]/[AC-06]/[AC-08] tests that assert the URL-driven behaviour.
- [CAR-UI-02][AC-01]: `toHaveBeenCalledWith(CARER_ID)` became `(CARER_ID, "")` and card names became full names. Reason: FD-01 (contract gains `query`; CHG-032).
- [CAR-UI-02][PRD] long name: sets `name` instead of `firstName`. Reason: cards now show `name`.
- Fixture helper `patient()` gains `name`. No other assertion changed.

### FD-04 — Additive `name`, `firstName` kept
- Date: 2026-09-29
- Decision: `CarerPatientRow` gains `name` (full); `firstName` stays for the patient header, tabs and 'View only' notice, which CHG-032's sweep will cover. Renaming would have touched five files and their tests outside this feature's scope.

### FD-05 — No migration
- Date: 2026-09-29
- Decision: `is_assigned_carer` (F0-18) already limits `clients` to the carer's shifts that have not ended, and the carer reads their own shifts, so two reads under the carer's session give the list. Unlike CAR-05 there is no past-shift name problem: an ended shift is not a patient.
- Consequence: the only shared-lane file touched is the mock, `src/mocks/queries/shifts.ts` (Lane S, edited from Lane C as CAR-UI-02 did; flag HUMAN REVIEW in the PR). The mock fixtures already have last names.

### FD-06 — Branch parent and PR target
- Date: 2026-09-29
- Context: CLAUDE.md and the PRD say branch from and PR to `carer-dev`; root PROGRESS.md records a 2026-09-28 workflow change to `main`. `carer-dev` currently equals `main` plus the CAR-01 retirement docs.
- Decision: branched from `carer-dev` per CLAUDE.md. Which target the PR uses is the human's call at PR time.

### FD-07 — Overlap with CAR-05 (PR open, unmerged)
- Both edit `src/server/shifts/queries.ts`, `src/mocks/queries/shifts.ts` and `src/server/shifts/queries.test.ts`. Human chose to branch now and resolve conflicts when the second PR lands (2026-09-29).

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
