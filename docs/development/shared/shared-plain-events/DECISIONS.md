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
