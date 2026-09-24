# Decisions — FAM-UI-03 Family Add / Edit event screens (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-10 | Status behaviour and undo | no | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |
| OQ-11 | Editing recurring events: scope | no | Add a scope choice when editing a recurring event (design required). |
| OQ-12 | Recurrence options and plan horizon | no | Options: Does not repeat, Daily, Weekly, Fortnightly, Monthly, Every 2 months, Quarterly, Every 6 months, Yearly; repeats indefinitely unless an end date is set. |
| OQ-22 | Event fields | no | Add Title, Start time and Duration fields to the event form (design update). |

## Feature decisions log

Non-blocking OQs: OQ-10, OQ-11, OQ-12 and OQ-22 have all been answered in root DECISIONS.md (PD-044, PD-045, PD-046, PD-047). This screen shows what the kit `EventForm` already does for them: the full recurrence list and Overdue shown but not selectable. The extra fields (Title, Start time, Duration, completion mode, edit scope) are FAM-06 / FAM-07 work, passed in through `extraFields`, and are not built here.

### FD-01 — Where Edit event gets its data (CHG-008)
- Date: 2026-09-24
- Context: `Occurrence` carries no recurrence, and no contract read one event.
- Decision: `getEvent` (CHG-008) gives the series fields: recurrence and description. The date and status come from the occurrence being edited, `?occurrence=<key>` (the route FAM-07's PRD names), read with `getOccurrence`. A key that belongs to another event is ignored. Without a usable key, the screen uses today's occurrence of the event (`getTodayOccurrences`), and failing that the event's anchor date as Planned. An unknown event id, or another client's, is `notFound()`.
- Reason: this satisfies AC-01 from the Task detail 'Edit' link, which carries no key yet, and matches the route FAM-07 will wire.
- Alternatives considered: waiting for a shared PR, or building without recurrence (AC-01 NOT MET). The human chose this option.
- Consequences: the Task detail 'Edit' link (FAM-UI-07) still opens without `?occurrence=`, so a past task opens on today's or the anchor date. FAM-07 should add the key to `editEventHref`.
- Human confirmation required: done (Dhruv Verma, 2026-09-24).

### FD-02 — Add event defaults
- Date: 2026-09-24
- Decision: Add event (PROPOSED, not designed) uses the Edit layout, empty: no date, 'Does not repeat', Planned, empty description, no documents, just the 'Add file' tile. The picker opens on the current Melbourne month.
- Reason: 'Does not repeat' is the first option in PD-046. The kit's Date validation gives AC-02.
- Human confirmation required: yes, design review (Add event is not designed).

### FD-03 — Document tiles and 'Add file'
- Date: 2026-09-24
- Decision: reuse FAM-UI-07's `DocumentTile` (lane F) with a new `showDetails={false}` prop, because Edit event draws only the icon and name (Task detail keeps the type and size line; its default is unchanged). 'Add file' is a local dashed tile, `AddFileTile`, the same size as a document tile. The shared `FileTile` add variant is a one-line chip and does not match the design. Tiles are 6.5rem (104px) wide, as drawn. Pressing 'Add file' uploads nothing and shows "Adding files is not available yet." in a status line. Uploads are F0-13 / FAM-08.
- Human confirmation required: no.

### FD-04 — Save event and Cancel
- Date: 2026-09-24
- Decision: Save event validates through the kit (a Date error, AC-02), then `router.back()`. Cancel is `router.back()` too. Nothing persists. Opened directly with no history, Back leaves the page the way the browser's own Back would.
- Human confirmation required: no.

### FD-05 — Loading, error and not-found states
- Date: 2026-09-24
- Decision: `events/loading.tsx` (a token-built form skeleton; the States sheet has no form skeleton), `events/error.tsx` (kit `ErrorState` plus Next 16 `retry`, nothing from the error shown), and `events/[eventId]/edit/not-found.tsx` ("Event not found", with a link back to the Calendar). The copy is a design gap, like FAM-UI-07's FD-08.
- Human confirmation required: yes, design review of the copy.

### FD-06 — Page title and heading outline
- Date: 2026-09-24
- Decision: the design puts 'Edit event' in the header bar. The family layout header shows client identity on every family screen (F0-15, D16), so the title is an `h1` at the top of the page body, the way Task detail does it. The kit `EventForm` titles 'Documents' and 'Pick a date' with `h3`, so the screen adds a visually hidden `h2` ("Event details") to keep the h1 > h2 > h3 outline that axe checks. No shared file is edited.
- Human confirmation required: no.

### FD-07 — Visual differences left as they are (kit or layout, not lane F)
- Real-browser check against `family-03-edit-event.png` at 1440, plus a 1920–768 sweep with no page scroll, no text overflow and no overlap.
- From the kit (`src/components/shared/**`, lane S): the `DatePickerGrid` day cells are about 30px tall against about 44px in the design (so the Pick a date card is shorter, and day buttons are below the 44px target rule); the Status legend is secondary grey where the design has it dark and emphasised; Overdue is shown disabled (PD-044); the picker has no dots under days with events. The dots need a date-range read, and `getOccurrences` (CHG-006) is not on `family-dev` yet.
- From the layout: the header shows client identity and the real date (FD-06). The page keeps the family screens' 24px side padding where the design leaves about 84px on the right.
- Fixture: the description reads "Mobility and strength session…" where the design says "30-minute…" (the fixture follows the 90-minute duration; see `src/mocks/fixtures.ts`).
- Raise with the shared owner: the DatePickerGrid cell size and 44px targets, and the Status legend style.

### FD-08 — The task switch (CHG-009)
- Date: 2026-09-24
- Context: root CHG-009 (PR #78 to `main`, human-confirmed) makes every event either a task (ticked off by hand) or a plain event (no status), with one form switch, "This is a task — must be ticked off", On for a new event. CHG-009 first put the switch in FAM-06 / FAM-07 only; the human then asked for it on this screen too, so the screen shows it on fixtures.
- Decision: a local `TaskSwitch` (`src/features/family-event-form/task-switch.tsx`, `role="switch"`, 44px tall, "On" / "Off" shown in words so state is not colour or position alone), passed to the kit `EventForm` through `extraFields`. Add event starts On; Edit event starts from `completionMode` (`manual` = On, `automatic` = Off; `isTaskEvent`). Pressing it changes local state only; Save event persists nothing (FD-04). Saving it, and the edit-scope rules (this occurrence / this and future / entire series from now), are FAM-06 / FAM-07.
- Kit gaps (lane S, not edited here): the kit has no switch component, so it is local until one is shared; and the kit `EventForm` always shows the Status chips, so with the switch Off the Status row is still shown, although a plain event has no status. The CHG-009 shared follow-up should add a way to hide Status for a plain event (and a shared switch); FAM-06 / FAM-07 then hide it.
- Human confirmation required: done (Dhruv Verma, 2026-09-24, asked for this feature's CHG-009 changes in-session). The switch has no Figma design yet: design review.
- Test changes caused: none changed; T-05 and T-06 added (AC-05, AC-06).

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
