# Session State — FAM-UI-08 Family event cost fields (UI)

Last session date: 2026-09-25
Current branch: `feature/family-ui-event-cost` (from `origin/family-dev` at 2411316), claimed and pushed
Worked on: START FEATURE. Gate checked (FAM-UI-03 and FAM-UI-05 merged, OQ-39 non-blocking), branch claimed, code inspected.
What changed: PROGRESS.md (Owner, Status IN PROGRESS, dependency status), this file
Tests run: none
Test results: —
Current blocker: waiting on the human's answer on data-layer scope (below)
Important discoveries:
- `EventForm` (`src/components/shared/forms/event-form.tsx`) has an `extraFields` slot, so Cost and Paid from can be built inside `src/features/family-event-form/**` with no shared-kit edit.
- `BudgetBucketSummary` already has `pendingTotal` and `pendingCount` (FAM-UI-05), so AC-03 and AC-04 need no budget contract change.
- `CareEvent` (`src/types/domain.ts`) has no cost or bucket field, and there is no fixture event with a $90 NDIS cost. AC-06 needs both. `src/types/**` and `src/mocks/**` are Lane S folders (AGENT_REFERENCE.md); the PRD says to extend the contracts as a CHG on this branch (CHG-002 covers `src/server/**`, not `src/types` or `src/mocks`).
Exact next action: on the human's answer, record it in DECISIONS.md (FD-01), write T-01 to T-06 first, run them and confirm they fail for the right reason, commit `test(family): …`.
