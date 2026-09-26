# Decisions — CAR-UI-03 Carer Calendar screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-33 | Carer calendar and task semantics | no | ANSWERED (PD-043), amended by CHG-025: blocks are shifts, no checklist. |

## Feature decisions log

### FD-01 — Apply CHG-025 and CHG-030 to this feature
- Date: 2026-09-26
- Context: The planned AC-01/AC-02 were built on event blocks and a selected-shift checklist, which CHG-025 removed. The screen needs a week or month of shifts, and the contract only had today's.
- Decision: Blocks are the carer's shifts (client first name, time range); no Tasks panel. Add `getCarerShifts(carerId, range)` to `src/server/shifts/queries.ts` and `src/mocks/queries/shifts.ts` (outside Lane C, flagged for review in the PR). Navigation matches Family · Calendar (`?view=&date=&month=`, D/W/M, Previous/Next, Today), importing `src/features/family-calendar/calendar-params` without editing it. A block click opens `/carer/patients/[clientId]`.
- Reason: human answers in-session, 2026-09-26 (CHG-030).
- Alternatives considered: waiting for a shared PR for the query; D/W/M fixed to today; no-op block click.
- Consequences: AC-01, AC-02 rewritten, AC-04 to AC-10 added before implementation. Previous/Next/Today are a design gap, built from tokens — please review. `/carer/patients/[clientId]` is delivered by CAR-UI-02 (PR #125); until it merges to `carer-dev` the link lands on a 404 in the preview.
- Human confirmation required: no (confirmed, Dhruv Verma, 2026-09-26)
- Test changes caused (if any): none (before implementation)

### FD-02 — Local toolbar, not Family's `CalendarToolbar`
- Date: 2026-09-26
- Context: Family's `CalendarToolbar` always renders an 'Enter event' link, which carers must not have.
- Decision: A small toolbar in `src/features/carer-calendar/` ('Shifts' heading, range label, Previous/Next <unit>, Today, the kit's `SegmentedControl`). Lane F files are not edited.
- Human confirmation required: no

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
