# Decisions — FAM-15 Family — Task detail

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

None open. OQ-29 (PD-055) and OQ-10 (PD-044) are ANSWERED in root DECISIONS.md.

## Feature decisions log

### FD-01 — Task detail stays read-only: no Mark done / Undo control
- Date: 2026-09-30
- Context: CHG-020 lists "CAR-06, FAM-15 (completion): completing an occurrence charges its cost or makes it pending through F0-12". The FAM-15 PRD (Out of Scope: Undo Done) and CHG-014 ("Task detail stays read-only") say the screen has no completion control.
- Decision: no Mark done or Undo control on Task detail. Completion stays on the Calendar Tasks panel and the Carer screens, which already call `setOccurrenceDone` / `setOccurrenceUndone` (charging through F0-12).
- Reason: matches the controlled PRD and CHG-014; nothing in FAM-15 completes an occurrence, so the CHG-020 line has nothing to do here.
- Alternatives considered: add Mark done + Undo here (needs a CHG, new ACs, and budget-charging tests).
- Human confirmation required: yes. CONFIRMED 2026-09-30 (Dhruv Verma, option A).
- Test changes caused: none.

### FD-02 — Plain events open on Task detail; no 'Care log' rename yet
- Date: 2026-09-30
- Context: shared-plain-events FD-01 says the Care log (FAM-UI-07, FAM-14, FAM-15) reads with `type: "all"`, and CHG-009 says a plain event's detail shows 'Event · No tick-off needed', no pill, back link 'Back to Care log'. Today the page calls `getOccurrence` with tasks only, so a plain event is a 404. FAM-14 FD-02 flagged the same gap for the Task log.
- Decision: the page reads with `{ type: "all" }` and `TaskDetailView` accepts a plain event: Status card 'Event · No tick-off needed', no pill, no 'Completed at'. The Back label keeps following the origin ('Back to Task log' by default). The Family 'Care log' rename is a separate item and is not done here.
- Reason: fixes the 404 without a half-done rename (the Task log screen is still called 'Task log').
- Alternatives considered: rename the Back link now (screens would disagree); tasks only (families hit a 404 on a plain event).
- Human confirmation required: yes. CONFIRMED 2026-09-30 (Dhruv Verma, option A).
- Test changes caused: none to existing tests (new tests T-07, T-08, T-09).

### FD-03 — A cancelled-after-completion occurrence still opens, as Done
- Date: 2026-09-30
- Context: the PRD edge case says an occurrence cancelled after completion stays viewable as Done. `buildOccurrences` drops cancelled occurrences, so `getOccurrence` returns nothing for it (404).
- Decision: when a key names an occurrence that has a completion row but is cancelled by an override, `getOccurrence` still returns it, with its completion's status and actor. Range reads (`getOccurrences`, the log, Home) are unchanged and keep hiding cancelled occurrences.
- Reason: PRD Error / Edge Cases, a controlled requirement.
- Alternatives considered: none (it is the stated requirement). The exact mechanism is the implementer's, inside `src/server/events`.
- Human confirmation required: no (implements the PRD as written).
- Test changes caused: none (new test T-10).

### FD-04 — Acceptance criteria reworded at start
- Date: 2026-09-30
- Context: AC-01 and AC-02 name 'Aisha R.', which CHG-032 replaced with full names (the merged UI and its tests already show 'Aisha Rahman'). AC-03 names 'Wound dressing check' as an Overdue row, but in the seed it is Done; the Overdue rows are 'Weekly weigh-in' and 'Medication review'.
- Decision: AC-01/02 use full names; AC-03 uses 'Weekly weigh-in'; AC-05 to AC-08 added for FD-02, FD-03 and the entry points.
- Reason: CHG-032 is answered; the AC-03 row was a design-copy inaccuracy against the fixtures.
- Human confirmation required: no for the wording (already answered elsewhere); the added ACs follow from FD-02 and FD-03.
- Test changes caused: none.

### FD-05 — Most of the screen and its entry points are already built
- Date: 2026-09-30
- Context: FAM-UI-07 built the route, view, Documents card, not-found and loading states, Back to origin and Edit event; FAM-UI-01/02 link the Overdue card, Recent activity and Log panel with origin params; `getOccurrence` and `getEventDocuments` already have a Supabase branch.
- Decision: FAM-15 verifies these against real data (integration tests) and adds only FD-02 and FD-03. Tests for already-built behaviour may pass on first run.
- Human confirmation required: no.

### FD-06 — One existing test assertion updated (HUMAN REVIEW: test expectation changed)
- Date: 2026-09-30
- Test: `[FAM-UI-07][AC-04]` in `src/app/(family)/family/[clientId]/tasks/[occurrenceKey]/page.edge.test.tsx`.
- Before: `expect(getOccurrence).toHaveBeenCalledExactlyOnceWith(ID, FUTURE.key)`.
- After: `toHaveBeenCalledExactlyOnceWith(ID, FUTURE.key, { type: "all" })`.
- Reason: recorded requirement change (FD-02): the page now reads with `type: "all"` so plain events open. The test's intent (opens a future task through `getOccurrence`, no log scan) is unchanged.
- Implementation note (FD-03): `buildOccurrences` takes `keepCancelledWithCompletion`; only `getOccurrence`'s Supabase branch sets it, so range reads still hide cancelled occurrences.
- Human confirmation required: review in the PR.

### FD-07 — Follow-up (not built here): late-completion wording
- Date: 2026-09-30
- Context: the human asked that a task completed after it was overdue show how late it was and its original due date (for example "Done · Aisha Rahman · 2 days late"). No existing feature covers it. Completion itself is FAM-05 (Calendar Tasks panel) and the Carer screens; Task detail stays read-only (FD-01).
- Decision: not built in FAM-15. To be a separate Family feature, proposed as "Late completion wording". It would add one shared helper that turns the due time and `completedAt` into the wording (Melbourne time), and use it on Task detail, the Task log and the Calendar Tasks panel. No data or database change.
- Depends on: FAM-15, FAM-14, FAM-05 merged.
- Next step: promotion needs a CHG entry, human confirmation, and feature docs from `docs/templates/FEATURE_TEMPLATE/` (DEVELOPMENT_PLAN.md §7).
- Human confirmation required: yes, to promote. Recorded as a follow-up 2026-09-30 (Dhruv Verma).

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
