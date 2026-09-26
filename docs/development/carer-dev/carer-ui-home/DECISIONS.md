# Decisions — CAR-UI-01 Carer Home screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Decisions affecting this feature

| ID | Decision | Status |
|---|---|---|
| OQ-14 | Carer notifications scope → PD-048, amended by CHG-025: shift assigned/changed/cancelled only. | ANSWERED |
| OQ-33 | Carer calendar and task semantics → PD-043, amended by CHG-025: carer calendars show shifts, not events. | ANSWERED |
| CHG-009 | Tasks and plain events. No longer reaches this screen: it shows no events or tasks. | n/a here |
| CHG-025 | Carer calendars show shifts; notifications are shift changes only; Carer Home drops the Tasks card. | CONFIRMED 2026-09-26 |

## Feature decisions log

### FD-01 — Scope rewritten by CHG-025 before implementation
- Date: 2026-09-26
- Context: the human changed the Carer Home content in-session before any code was written.
- Decision: PRD Scope, AC-01 and AC-02 rewritten; AC-04 to AC-10 added (see ACCEPTANCE_CRITERIA.md). The design image no longer matches for layout and calendar rows.
- Reason: CHG-025.
- Consequences: PR flags "design gap, built from tokens — please review" for the calendar rows and the Notifications card position.
- Human confirmation required: no (CHG-025 confirmed by Dhruv Verma, 2026-09-26).
- Test changes caused: none (no tests existed).

### FD-02 — Edits outside Lane C's folders
- Date: 2026-09-26
- Context: the screen needs a carer-scoped shifts read and a notifications read. Neither contract exists, and the notification fixtures did not match AC-02.
- Decision: add `src/server/shifts/queries.ts` (`getCarerTodayShifts`) and `src/server/notifications/queries.ts` (`getCarerNotifications`), each with a mock query in `src/mocks/queries/`; rewrite `CARER_NOTIFICATIONS` and add two Aisha shifts to `SHIFTS` in `src/mocks/fixtures.ts`. `src/types/**` and `src/components/shared/**` are not touched: the shift row type (`CarerShiftRow`) lives in the server contract file.
- Reason: human approved in-session (CHG-025), matching the FAM-UI-02 / CHG-012 precedent of a UI feature extending the contract.
- Consequences: flag both shared-folder edits in the PR. Existing `src/mocks/fixtures.test.ts` assertions on `SHIFTS` or `CARER_NOTIFICATIONS` may need updating; record any such change here with the test ID, before, after and reason.
- Human confirmation required: no (given 2026-09-26).

### FD-03 — Today = shifts that start on the reference day
- Date: 2026-09-26
- Decision: `getCarerTodayShifts` returns the carer's shifts whose start falls on today's Melbourne calendar day (the same "today" `getTodayOccurrences` uses, `getToday()`), ordered by start. A shift that started yesterday and runs past midnight is not listed.
- Reason: matches the existing "today" rule; no overnight shifts exist in the fixtures or designs.
- Consequences: revisit in CAR-01 if overnight shifts are real.

### FD-04 — Empty-state copy
- Date: 2026-09-26
- Decision: 'No shifts today' and 'No notifications', following Family Home's 'No care events today' style (no full stop).

### FD-05 — Local error state for the 'Try again' label
- Date: 2026-09-26
- Context: AC-08 and T-10 name the retry button 'Try again'; the kit's `ErrorState` (`src/components/shared/states.tsx`) hard-codes 'Retry' and takes no label prop. Lane C may not edit the shared kit, and the human asked for no test changes.
- Decision: `src/features/carer-home/carer-home-error-state.tsx` renders the same markup and tokens as `ErrorState` with a 'Try again' button (§4.2 local wrapper).
- Alternatives considered: change T-10 to 'Retry' (needs human sign-off); add a label prop to the kit `ErrorState` (shared PR).
- Consequences: two error-state copies until the human picks one wording. Flagged in the PR.
- Human confirmation required: yes (which wording the product uses).
- Test changes caused: none.

### FD-06 — Layout breakpoints
- Date: 2026-09-26
- Decision: the two cards sit side by side from 1024px (equal columns; 1.6 : 1 from 1280px, close to the design's Today/Tasks split) and stack below 1024px, like Family Home (FAM FD-18).

<!-- Template
### FD-xx — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
