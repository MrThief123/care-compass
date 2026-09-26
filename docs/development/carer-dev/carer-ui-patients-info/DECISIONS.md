# Decisions — CAR-UI-02 Carer Patients and patient info screens (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-09 | Carer access model | no | Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-19 | Figma access and remaining design gaps | no | Claude Code re-checks Figma in F0-01; each gap blocks only the features that cite it. |

## Feature decisions log

### FD-01 — Scope split and patient navigation (CHG-028)
- Date: 2026-09-26
- Context: CHG-026 gives carers the patient's Home, Calendar, Info and Care log. The Family components for Home, Calendar and Care log hardcode `/family/…` links (`home-routes.ts`, `task-routes.ts`) and have no read-only mode, and CHG-026 says Lane C must not edit them. There is no design for moving between a patient's screens (OQ-19 gap).
- Decision: split. CAR-UI-02 builds the Patients grid, the patient header with tabs (Home · Calendar · Info · Care log) under the carer rail, and the Info tab, reusing `FamilyInfoView` with `canEdit` = on shift. `FamilyInfoView` already takes `canEdit` and has no `/family` links, so it's imported as-is. Home, Calendar and Care log get routes with a 'Coming soon' holding state. `/carer/patients/[clientId]` redirects to `info` for now and will redirect to `home` once Home is wired.
- Reason: no cross-lane edit; no second copy of the Family screens.
- Alternatives considered: editing the family-* components from Lane C (rejected: CHG-026); carer copies of the screens (rejected: a second pattern); swapping in a patient rail (rejected: needs a Lane S edit to `nav-config.ts`).
- Consequences: **request to Lane F:** `FamilyHomeView`, `FamilyCalendarView` and `TaskLogView` (and the route helpers they use) need a base path (`/family/[id]` vs `/carer/patients/[id]`) and a read-only mode (no Enter event, no ticks, no 'View breakdown'). CAR-04 then replaces the holding tabs (CHG-026 already extends CAR-04 to the four screens).
- Human confirmation required: no, confirmed by Dhruv Verma, 2026-09-26 (in-session).

### FD-02 — Patients contract and fixtures
- Date: 2026-09-26
- Context: nothing lists a carer's patients, and the fixtures don't match the design (e.g. Jean is 70 and in Nunawading; the design says 88 and Fairfield VIC). Only Margaret has Aisha shifts.
- Decision: add `getCarerPatients(carerId)` to `src/server/shifts/queries.ts` (with a mock in `src/mocks/queries/shifts.ts`). It returns `{ clientId, firstName, age, suburb, onShift }` for every client the carer has a non-ended shift with (PD-041), soonest shift first, with `onShift` meaning a shift is in progress at the reference now. In `src/mocks/fixtures.ts`, set the six other clients' dob and suburb to the design (Robert 82 Reservoir VIC, Elsie 90 Thornbury VIC, Frank 76 Northcote VIC, Doris 85 Preston VIC, Harold 79 Coburg VIC, Jean 88 Fairfield VIC); give Aisha one future shift with each, from Tue 1 Dec onward and none on Mon 30 Nov, so Carer Home is unchanged; and give Daniel one shift that ended on Sun 29 Nov.
- Reason: data only through the contract (CLAUDE.md §7); matches the CAR-UI-01 precedent (its FD-02).
- Consequences: **`src/mocks/fixtures.ts` and `src/mocks/queries/shifts.ts` are Lane S files edited from Lane C (additive plus value changes; HUMAN REVIEW in the PR).** `src/server/shifts/` is Lane B, but dashboard features may add functions there (AGENT_REFERENCE). Any `fixtures.test.ts` assertion that breaks is recorded here with before, after and reason.
- Human confirmation required: no (follows precedent).

### FD-03 — Card order and search
- Date: 2026-09-26
- Decision: cards are ordered by the start of the carer's soonest non-ended shift, so a patient they're with now comes first. The fixture shifts are dated so this gives the design's order. Search filters first names case-insensitively on the loaded list; with no patients the empty state replaces the search field.
- Reason: the design gives an order but no rule; soonest-first is what a carer needs.
- Human confirmation required: no (PROPOSED; easy to change).

### FD-04 — Error state wording
- Date: 2026-09-26
- Decision: reuse the CAR-UI-01 wording ('Something went wrong', 'Try again', `router.refresh()`) in a local `src/features/carer-patients/` component; the kit's `ErrorState` says 'Retry' (CAR-UI-01 FD-05).
- Human confirmation required: no.

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
