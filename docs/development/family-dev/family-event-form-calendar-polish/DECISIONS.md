# Decisions — FAM-16 Family — Event form and calendar polish

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Status |
|---|---|---|---|
| OQ-22 | Event fields | YES | ANSWERED (PD-047): Title, Start time, Duration. Start and End time replace Duration by CHG-051 (human, 2026-10-02). |
| OQ-19 | Figma access and remaining design gaps | YES | ANSWERED: Claude Code builds from tokens and flags it in the PR. |

## Feature decisions log

### FD-01 — Baseline and the "150 failures"
- Date: 2026-10-02
- Context: CAR-07's FD-09 recorded 150 vitest failures on clean `main`; INT-10 saw 10.
- Finding: with the repo's `.env.local` (`DATA_SOURCE=supabase`, hosted project) 150 tests in 12 files fail, because mock-based page tests then call real Supabase `cookies()`. With `DATA_SOURCE=mock npx vitest run` on clean `main` (local Supabase running, integration files skipped): 199 files passed, 35 skipped, 2463 tests passed, 0 failed. With no `.env.local` at all, 55 files fail to load. So the red suite is environmental, not date- or fixture-sensitive.
- Decision: this feature's suites run with `DATA_SOURCE=mock`.

### FD-02 — Lane S edit to the date picker (HUMAN REVIEW)
- Date: 2026-10-02
- Context: PL-27 part 2 is for every role, and the picker lives in `src/components/shared/calendar/date-picker-grid.tsx` and `src/components/shared/forms/event-form.tsx` (Lane S, CLAUDE.md §4.2).
- Decision: one feature; two small additive edits inside this PR. `DatePickerGrid` gains optional `today` (default: today's Melbourne date) and marks it; `EventForm` opens on and follows the month of `values.date`. Considered: a separate shared PR first (not chosen), a local wrapper (cannot reach the grid's cells).
- Human confirmation: Dhruv Verma, 2026-10-02 (in-session), recorded as CHG-051. Flag in the PR summary.

### FD-03 — End time rules
- Date: 2026-10-02
- Decision: blank End allowed (duration 0); End must be after Start; no overnight. Edit shows End = start + duration, blank for 0. An existing event that runs past midnight shows the next-day clock time and must be given a same-day End to be saved (assumption: such events are rare; not asked of the human).
- Human confirmation: Dhruv Verma, 2026-10-02 (in-session): rules as proposed.

### FD-04 — Late = completion after the occurrence start
- Date: 2026-10-02
- Decision: the due time is the occurrence start (`dueTime`, F0-11), so lateness is `completedAt - start`, in elapsed whole minutes, rounded down; under a minute is not late. Assumption, consistent with how Overdue is derived.

### FD-05 — Existing tests changed (HUMAN REVIEW: test expectation changed)
- Date: 2026-10-02. Reason for all: recorded requirement change (CHG-051); flagged **HUMAN REVIEW: test expectation changed**.
- `event-details.test.ts` (FAM-06 AC-01/AC-02 tests): Duration to End time. Before: a non-numeric duration is refused, blank allowed, minutes parsed from typed text. After: a malformed End is refused, End not after Start is refused, blank allowed, minutes are end minus start. No assertion removed without a replacement.
- `event-details-fields.test.tsx`: the field labelled "Duration" (value "45") is now "End time" (value "10:15"), and Duration is asserted absent.
- `carer-manage-events.test.tsx` `[CAR-07][AC-04] T-04`: "Duration" label to "End time"; Duration asserted absent.
- `task-log-view.test.tsx` `cellTexts`: the STATUS cell is read from the pill only (the late note beneath it is tested by FAM-16), because fixture rows such as Morning medication (due 09:00, done 09:14) now carry a note.
- `tasks/page.test.tsx` (two tests): Mon 30 Nov Morning medication status text is now "Done · Aisha RahmanCompleted 14 minutes late" (cell text content).
- New: FAM-16 tests listed in TEST_PLAN.md; added cases appended to `event-form-add.test.tsx` and `event-form-edit.test.tsx`.

### FD-06 — Dev server and preview notes
- A symlinked `node_modules` breaks Turbopack ("points out of the filesystem root"); the worktree uses an APFS clone (`cp -cR`). The dev server answers script chunks 403 on `127.0.0.1`; browse via `localhost`.
- The mock Family fixtures are dated November 2026, so the Add event picker (which opens on the date, else this month) shows October 2026 and rings Friday 2 October 2026, today.

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
