# Decisions — CAR-07 Carer — Add and edit events for a patient

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Status |
|---|---|---|---|
| OQ-09 | Carer access model | YES | ANSWERED (PD-041, CHG-027): edit only while a shift with the client is in progress. |
| OQ-22 | Event fields | YES | ANSWERED (PD-047): Title, Start time, Duration. |
| OQ-19 | Figma access and remaining design gaps | YES | ANSWERED: Claude Code builds the carer add-event entry from tokens and flags it in the PR. |

## Feature decisions log

All three blocking OQs are ANSWERED in root DECISIONS.md. CHG-048 (2026-10-02) rewrites this feature's scope.

### FD-01 — The form is reused unchanged, cost fields included
- Date: 2026-10-02
- Context: PD-058 lets a carer set an event's cost and bucket; CAR-08 is retired. Today the Family form validates Cost but `createEvent` and `updateEvent` do not save it for anyone.
- Decision: carers get the Family `EventFormScreen` as is, Cost and Paid from showing. CAR-07 does not add cost persistence. Hiding them behind a flag was offered and declined.
- Human confirmation: Dhruv Verma, 2026-10-02 (in-session): "Show it, same as Family".
- Consequences: a carer who types a cost sees it validated and then not kept, exactly as a family member does today. The gap belongs to whichever feature wires event cost (PD-058); noted for the PR.

### FD-02 — Entry points: Calendar, Home and Task detail, on shift only (amended by FD-08)
- Date: 2026-10-02
- Decision: 'Enter event' on the Calendar toolbar (`canAddEvent`), 'Edit event' on Task detail (`canEdit`), and (originally) 'Add event for <first name>' on the Patients card, replaced by 'Enter event' on the Home by FD-08. All absent off shift. Routes redirect to the Calendar off shift. This reverses CAR-06 FD-02 (read-only Task detail) and FD-06 (no Add event link) for on-shift carers.
- Human confirmation: Dhruv Verma, 2026-10-02 (in-session); recorded as CHG-048.

### FD-03 — CAR-06 T-07 changed (HUMAN REVIEW: test expectation changed)
- Date: 2026-10-02
- Test: `src/features/carer-patients/carer-complete-task.test.tsx` `[CAR-06][AC-07] T-07`.
- Before: Calendar, Home and Care log on shift have no Add event, Edit event or View breakdown link.
- After: Home and Care log unchanged; the Calendar on shift has 'Enter event' (and still no Edit event or View breakdown); off shift the Calendar has none.
- Reason: recorded requirement change (CHG-048). Flagged in PROGRESS and the PR.

### FD-04 — Shift-ended message through an additive `notAllowedMessage` prop (assumption)
- Date: 2026-10-02
- Context: `createEvent` and `updateEvent` already map the database refusal to `NOT_ALLOWED` with a family-oriented message. The carer needs the shift-ended wording and Family must not change.
- Decision: add an optional `notAllowedMessage` prop to Lane F's `EventFormScreen` (default: the action's own message). Carer pages pass "Your shift with <first name> has ended, so this event wasn't saved." Considered instead: a role lookup inside the actions (rejected: a second query in a Lane B contract for a copy change).
- Outcome: built as `notAllowedMessage?: string` on `EventFormScreen`; a `refusalMessage` helper picks it only for `NOT_ALLOWED`, every other error keeps its own message. Family passes nothing, so it is unchanged (T-08). Still for the human's review in the PR (Lane F edit, additive, CHG-043's pattern).

### FD-05 — Off shift redirects rather than showing a read-only form
- Date: 2026-10-02
- Decision: `/carer/patients/<id>/events/new` and `/events/<eventId>/edit` redirect to the patient's Calendar when no shift is in progress (the View only notice explains why). A patient with no shift at all redirects to Patients (`findCarerPatient`, CAR-UI-02 AC-09). Assumption: not asked of the human; consistent with "absent, not disabled".

### FD-06 — Pre-existing failure in CAR-06's T-08 (not caused by this feature)
- Date: 2026-10-02
- Context: on `main`, `[CAR-06][AC-08] T-08 the Family Home keeps its /family links…` fails: "No 'getLandingPath' export is defined on the '@/server/auth/queries' mock". FAM-01 (merged after CAR-06's tests) made the Family Home call `getLandingPath`.
- Decision: left as is here (outside this feature's scope). One-line fix: add `getLandingPath` to that file's `@/server/auth/queries` mock. Raised to the human.

### FD-07 — Superseded
- The Patients card link and the `cardLinks()` selector change it needed (CAR-UI-02 AC-01 and AC-15) were reverted under FD-08. `carer-patients.test.tsx` is unchanged from `main`.

### FD-08 — Home replaces the Patients card link (HUMAN REVIEW: test expectation changed)
- Date: 2026-10-02
- Context: after trying the build the human did not want an event link on the Patients card and asked for 'Enter event' on the Home as well as the Calendar. Recorded as root CHG-049.
- Decision: the card link is removed. `FamilyHomeView` gains an additive `canAddEvent` (default false), set from `patient.onShift` by the carer Home page (a Family file edit beyond the prop in FD-04, at the human's request). Family Home is unchanged.
- Test changes caused: `carer-manage-events.test.tsx` T-03 (Patients card: now asserts no add link; Home: now asserts 'Enter event' on shift and none off shift) and `carer-complete-task.test.tsx` `[CAR-06][AC-07] T-07` (Home moved out of the "no Add event" table into its own on-shift test). Reason: recorded requirement change (CHG-049). Flagged for review: yes.
- Human confirmation: Dhruv Verma, 2026-10-02 (in-session).

### FD-09 — Pre-existing red suite, and design gap
- Date: 2026-10-02
- Pre-existing: the full vitest suite has 150 failures in 12 files on a clean `main` checkout, the same 150 here, including FD-06. 109 are in the Family event-form, calendar and task-detail suites ("Cannot read properties of undefined (reading 'eventId')", probably date- or fixture-sensitive). Not touched; raised to the human.
- Design gap (OQ-19): no design exists for the carer entry points. The Home and Calendar 'Enter event' reuse the Family button and the Task detail 'Edit event' the Family link, all from tokens. Flagged in the PR: "design gap, built from tokens, please review".
- Parked: PL-27 (late-completion note, date-picker today ring and active month, start and end time instead of minutes), root CHG-049.

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
