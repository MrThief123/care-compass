# Decisions — UI-05 Plain events in the shared kit and contracts (CHG-009)

## Open decisions affecting this feature
| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-31 | Task log range (is there an "up to end of today" bound?) | no | Not applied, as in UI-04: the contract returns the whole history. |

Authorisation: root DECISIONS.md CHG-009 (human, 2026-09-24). The human approved creating this feature and its plan card in-session on 2026-09-24.

## Feature decisions log

### FD-01 — New contract options default to the current behaviour (ANSWERED: Option A)
- Date: 2026-09-24
- Context: CHG-009 says the Care log filter starts on **All** and the Today timeline shows tasks and plain events. If the contracts started returning plain-event rows to callers that pass no new option, Margaret's log total (137), page 1 and the reference day would change, breaking UI-04's tests on `main` and the FAM-UI-01 / FAM-UI-07 tests on `family-dev` (which this lane may not edit), against the rule that existing dashboard tests stay green.
- Decision (proposed): `getTaskLog` with `type` omitted returns **tasks only**, and `getTodayOccurrences` gains an optional options argument whose default is also tasks only. A screen that shows both passes `type: "all"` explicitly (the Care log's "All" choice, the Today timeline). `getOccurrence` returns plain events always (no existing caller holds a plain-event key).
- Reason: backward compatible; each lane opts in when it adopts CHG-009.
- Alternatives considered: default `all` (matches the UI default, but changes existing results and needs HUMAN REVIEW test changes on `main` and breaks `family-dev` tests when `main` is merged there).
- Human confirmation required: done. Dhruv Verma, 2026-09-24: "let's go with option A for now, but remember that in the audit export log or the task log, all events and tasks should appear at the same time, since this needs to be able to be exported."
- Consequences: every log view and every export reads with `type: "all"`, so tasks and plain events appear together: the Care log (FAM-UI-07, FAM-14, FAM-15) and any later log export (PL-06 audit log CSV export, PL-08 client data export, both parked). The `getTaskLog` contract doc comment says so (Task 3), and the adoption notes in PROGRESS.md tell the Family lane. "For now": the default may be switched to `all` later, once every caller passes `type` explicitly.

### FD-02 — Preview pages under `src/app/dev-preview-*` (ANSWERED: option a)
- Date: 2026-09-24
- Context: Task 7 asks for a real-browser check of the kit preview pages. They live in `src/app/dev-preview-calendar-kit/` and `src/app/dev-preview-forms-kit/` (built by UI-01 / UI-02, shared lane), but this session's instructions forbid editing `src/app/**`. Without an edit, the preview pages cannot show a plain event or the switch.
- Decision: option (a). Only `src/app/dev-preview-calendar-kit/` and `src/app/dev-preview-forms-kit/` may be edited, to add plain-event and switch examples; every other path under `src/app/**` stays off limits. Options were: (a) allow editing only the two shared `src/app/dev-preview-*` pages to add plain-event and switch examples; (b) leave them as they are and check only that existing states still render, with the new states covered by component and axe tests.
- Human confirmation required: done. Dhruv Verma, 2026-09-24: "Yes, you can add the plan event and switch examples."

### FD-03 — Occurrence type shape for plain events (ANSWERED: Option A)
- Date: 2026-09-24
- Context: Task 2 audit. On `main`, only files inside `src/types`, `src/server`, `src/mocks` and `src/components/shared` read an occurrence's status; outside them, `src/app/page.tsx`, `src/app/dev-preview-calendar-kit/fixtures.ts` and `src/components/ui/primitives.axe.test.tsx` only build task occurrences or render `StatusPill` with a literal status, and `src/lib/recurrence` has its own status-free `Occurrence` type. On `family-dev`, about 12 places (home timeline, recent activity, task detail, task log table) read `occurrence.status` from `getOccurrence` / `getTodayOccurrences` / `getTaskLog` results, so making `Occurrence.status` optional would break their type check when `family-dev` merges `main`.
- Decision: Option A. `Occurrence` stays the task occurrence with a required status and gains an optional `kind?: "task"`. A new `PlainEventOccurrence` has `kind: "event"` and no `status`, `actor` or `completedAt` (strict: rejected if present). `AnyOccurrence = Occurrence | PlainEventOccurrence`; `isPlainEvent()` tells them apart and narrows. Contracts follow FD-01: with no `type`, results are typed and filled as today; with `type` (and `getOccurrence(clientId, key, { type: "all" })`), they return `AnyOccurrence`. Without the option, a plain event's key is not found by `getOccurrence` (no plain-event rows existed before, so no caller changes). This supersedes the FD-01 line "`getOccurrence` returns plain events always".
- Alternatives considered: (B) make `Occurrence` itself the union (one type, but breaks ~12 `family-dev` call sites on merge); (C) stop and plan with the Family lane.
- Human confirmation required: done. Dhruv Verma, 2026-09-24: "A".

### FD-04 — `TaskLogQuery` keeps its pre-UI-05 shape (implementation note, within FD-01 / FD-03)
- Date: 2026-09-24
- Context: `TaskLogQuerySchema` gains `type` (AC-02). If the exported `TaskLogQuery` type (its `z.infer`) gained `type` too, every existing value typed `TaskLogQuery` (UI-04 tests on `main`; `family-dev` home-loader tests and the three dev branches' copies of `queries.test.ts`) could carry a `type`, so the `getTaskLog` overloads could no longer type their results as `Occurrence`.
- Decision: `TaskLogQuery = Omit<TypedTaskLogQuery, "type">` (unchanged shape); `TypedTaskLogQuery` is the full parsed query, used by the mock adapter. `getTaskLog`, `getTodayOccurrences` and `getOccurrence` have overloads: without a `type` option they return `Occurrence` types as before; with one, `AnyOccurrence`.
- Plain-event rows live in a separate fixture map, `PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID`, so `OCCURRENCES_BY_CLIENT_ID` (and every test reading it) is unchanged. Afternoon walk's `start` moves from 2026-12-01 to 2026-11-26 14:00 so its daily series has a row on every day of the reference week (no test on `main` or the dev branches depends on the old date).
- Verified: `origin/family-dev` merged with this branch in a scratch worktree type-checks clean and its 964 unit tests pass. The merge has import-line conflicts only, in `src/server/events/queries.ts` and `src/mocks/queries/events.ts` (`family-dev` added `getEvent`); keep both sides' imports.
- Human confirmation required: no (follows FD-01 / FD-03; no behaviour choice).

### FD-05 — The calendar kit's plain-event look (implementation note, within AC-07 / AC-08 / AC-12)
- Date: 2026-09-24
- Cue: `EVENT_CUE` in `status-cue.ts` (label "Event", no icon) and `occurrenceCue(occurrence)`, which every surface now calls instead of `STATUS_CUE[item.status]`. `STATUS_CUE` is unchanged.
- Bar: a solid neutral stripe (`bg-text-secondary`), per **CHG-010**. A dotted bar was tried first so a plain event would not differ from a Planned task by colour alone on compact day blocks, week blocks and month chips (where Planned also has no shape and the status word is read out only); the human preferred the solid stripe and accepted that trade-off for event type (status is still never colour alone).
- Label: new `EventPill` (`src/components/shared/event-pill.tsx`, beside `StatusPill`), used where `StatusPill` goes (day `full` tier, popover). Task 5 reuses it in the lists kit.
- Types: `DayTimeline`, `WeekGrid` and `MonthGrid` props are generic, `<T extends AnyOccurrence = Occurrence>`, so callers that pass `Occurrence[]` keep `(occurrence: Occurrence) => …` callbacks; callers that pass `AnyOccurrence[]` get `AnyOccurrence` back. `EventPopover` and the internal `useEventHover` take `AnyOccurrence`. Month chips gain `data-testid="month-grid-chip-<key>"` (additive).
- Verified: `origin/family-dev` merged with this branch (scratch worktree) type-checks clean and its 990 unit tests pass. The merge also conflicts on `DECISIONS.md` (root): `main`'s CHG-009 entry against `family-dev`'s CHG-008 entry — keep both; not caused by this branch.
- Human confirmation required: no (within the approved ACs).

### FD-06 — `ActivityRow` for a plain event (implementation note, within AC-09 / AC-12)
- Date: 2026-09-24
- Decision: `ActivityRowProps` becomes a union. The task form is unchanged (`status` required, optional `actorName`, plus an optional `kind?: "task"`); the plain-event form is `kind: "event"` with no `status` or `actorName` (typed `never`). A plain-event row renders `EventPill` where `StatusPill` goes; title, date, chevron and the button/div shell are shared. Every existing caller (`AlertListCard`, the showcase page, dashboard lanes) compiles and renders as before.
- `StatusPill` itself is unchanged. `AlertListCard` stays overdue-only (a plain event is never overdue). The other lists-kit components (`DataTable`, `NotificationRow`, `SelectableListRow`, `TaskChecklist`) have no status slot, so they need no change.
- Preview: no lists preview page is editable under FD-02, so plain-event rows are covered by component and axe tests only; the showcase `ActivityRow` (task) was checked unchanged in a real browser.
- Human confirmation required: no (within the approved ACs).
