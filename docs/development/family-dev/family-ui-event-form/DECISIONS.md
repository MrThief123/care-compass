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

Non-blocking OQs: OQ-10, OQ-11, OQ-12 and OQ-22 have all been answered in root DECISIONS.md (PD-044, PD-045, PD-046, PD-047). This screen shows what the kit `EventForm` already does for them: the full recurrence list and Overdue shown but not selectable. The extra fields (Title, Start time, Duration, edit scope) are FAM-06 / FAM-07 work, passed in through `extraFields`, and are not built here. Since CHG-009 the task switch (completion mode) is shown here on fixtures (FD-08).

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
- **Superseded in part by FD-09 (CHG-015):** Save event and Cancel now go to a validated `returnHref`, not `router.back()`. Nothing persists, as below.
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
- From the kit (`src/components/shared/**`, lane S): the `DatePickerGrid` day cells are about 30px tall against about 44px in the design (so the Pick a date card is shorter, and day buttons are below the 44px target rule); the Status legend is secondary grey where the design has it dark and emphasised; Overdue is shown disabled (PD-044); the picker has no dots under days with events. The dots need a date-range read, and `getOccurrences` (CHG-012) is not on `family-dev` yet.
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

### FD-09 — CHG-015: where Save event and Cancel go, and the occurrence Task detail passes
- Date: 2026-09-24
- Context: root CHG-015 (human-confirmed in-session), closing FAM-UI-07 FD-29. FD-04 used `router.back()`, which breaks after a reload, on a shared link and after arriving from outside the app; and Task detail's 'Edit event' did not pass `?occurrence=`, so the form opened on today's occurrence.
- Decision: `src/features/family-event-form/event-form-return.ts`. `editEventHrefFrom(clientId, occurrence, origin?)` builds Task detail's 'Edit event' link: `…/edit?occurrence=<key>` plus Task detail's origin (`from=` and that screen's params) via the new `taskDetailOriginQuery` in `task-detail-origin.ts`, which `taskDetailHrefFrom` now uses too (`taskLogQuery`, formerly the private `viewQuery`, is exported from `task-routes.ts` for it). The Edit event page re-validates both: the key must resolve through `getOccurrence` to this event, and the origin goes through `resolveTaskDetailOrigin`. `editEventReturnHref` is that occurrence's Task detail with the origin (`taskDetailHrefFrom`), or with no valid occurrence the origin screen itself (`backLinkFor`, the Task log with no origin). Add event's is Home (`addEventReturnHref`, via `backLinkFor`), its only opener; the Add event page now reads `params` for the client id. `EventFormScreen` takes a validated `returnHref` and calls `router.push(returnHref)` for both Save event (after the kit's validation) and Cancel. Nothing persists (FD-04 otherwise unchanged).
- Reason: one pattern with Task detail's Back (CHG-014): whitelisted names and checked values only, never a URL or path from the query, and it works on reload and shared links.
- Alternatives considered: `router.back()` with a fallback (still wrong after a reload with history, e.g. arriving from another site); a `returnTo=<path>` param (an open-redirect risk); `router.replace` (leaves the form out of history, which surprises a browser Back user; `push` matches a normal link).
- Consequences: FD-04's navigation is superseded. The Edit event URL also carries the Task detail origin params (`from`, `view/date/month` or `q/status/page`); they do not collide with `occurrence`. The `?as=` role param is not carried, the same as CHG-014's links.
- Human confirmation required: done (Dhruv Verma, 2026-09-24, CHG-015, "do both").
- Test changes caused: see FD-10.

### FD-10 — Existing tests whose expectation changed (CHG-015). **HUMAN REVIEW: test expectation changed**
- Date: 2026-09-24
- Context: CHG-015 is a recorded requirement change (CLAUDE.md §5). No test was skipped, `.only`-ed or deleted.
- Changes (test, before, after, reason):
  1. `edit/page.test.tsx` `[PRD] Save event returns to the previous screen without persisting; Cancel returns too`: before, `router.back` called once per press; after, retitled `[AC-08] Save event (without persisting) and Cancel go to the occurrence's Task detail with its origin, never router.back`, opened with an occurrence and a Calendar origin, expects `router.push` with that Task detail href and `router.back` not called. Reason: FD-09.
  2. `new/page.test.tsx` `[AC-02] once a date is picked, Save event returns to the previous screen`: before, `router.back` called once; after, retitled `[AC-09] …goes to Family Home, never router.back`, expects `router.push("/family/client-margaret/home")` once. The AC-02 validation test itself is unchanged. Reason: FD-09.
  3. `new/page.test.tsx` `renderNew` helper: the page now takes `params` (the client id), so the helper is async and passes `{ clientId }`; the axe test awaits it. No assertion changed.
  4. FAM-UI-07 `task-detail-view.test.tsx` `[PRD] shows the Description card, which no longer holds an Edit link…` and `[AC-09] shows one 'Edit event' button in the title row…`: expected href gained `?occurrence=<encoded key>`. Reason: FD-09 (CHG-015 (1)).
  5. FAM-UI-07 `[occurrenceKey]/page.test.tsx` `[AC-09] shows the Edit event button linking to the event's edit route`: retitled `…with the occurrence and origin (CHG-015)`; expected href gained `?occurrence=<encoded key>&from=calendar&view=week&date=<today>`. Reason: FD-09.
  6. FAM-UI-07 `tests/e2e/family-task-detail-nav.spec.ts` `[AC-09] the Edit event button opens the event's edit page`: expected URL gained `?occurrence=<encoded key>&from=home`. Reason: FD-09.

### FD-11 — CHG-017: Add event returns to the Calendar it was opened from
- Date: 2026-09-24
- Context: root CHG-017. The Calendar now opens Add event (FAM-UI-02 FD-14), so Home is no longer its only opener (FD-09, AC-09).
- Decision: `event-form-return.ts` gains `addEventHrefFrom(clientId, { from: "calendar", view })`, which builds `…/events/new?from=calendar&view=…&date=…[&month=…]` with `taskDetailOriginQuery`, and `addEventReturnHref(clientId, origin?)`, which is the Calendar view (`backLinkFor`) for a Calendar origin and Home for anything else (Home, the Task log, none, hostile). The Add event page now reads `searchParams` and re-validates them with `resolveTaskDetailOrigin` (the Calendar's own parser, `getToday` as its fallback day), as the Edit event page does.
- Reason: one pattern with CHG-014 / CHG-015: whitelisted names and checked values, never a URL from the query.
- Alternatives considered: a separate origin parser for Add event (a second pattern); honour a Task log origin too (the Task log has no Add event button).
- Consequences: AC-09's "its only opener" now reads "with no Calendar origin"; no AC-09 assertion changed. The `?as=` role param is not carried, as with CHG-014.
- Human confirmation required: done (Dhruv Verma, 2026-09-24, CHG-017, "Back to Calendar view").
- Test changes caused: `new/page.test.tsx` `renderNew` also passes `searchParams` (default empty), because the page now takes them; no assertion changed.

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
