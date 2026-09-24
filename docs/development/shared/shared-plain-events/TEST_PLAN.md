# Test Plan — UI-05 Plain events in the shared kit and contracts (CHG-009)

## Approach

Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Titles start `[UI-05][AC-xx]`.

## Test levels used

- **unit** → `src/**/<module>.test.ts` (Vitest, colocated): schemas, fixtures.
- **contract** → `src/server/**` / `src/mocks/queries/**` tests with `DATA_SOURCE=mock`, the same path the screens use.
- **component** → `src/components/shared/**/<component>.test.tsx` (Testing Library).
- **axe** → the kit axe files (`calendar.axe.test.tsx`, `lists-cards-kit.axe.test.tsx`, `forms-kit.axe.test.tsx`).
- **e2e** → existing Playwright suite only (regression, Task 7).

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | unit | Task occurrence without a status, or with an unknown status, rejects; plain-event occurrence without status parses; plain-event occurrence with status, actor or completedAt rejects. | ☑ | PASS |
| T-02 | AC-01 | unit | The task / plain-event helper returns the right answer for both kinds (plus a type-level narrowing check). | ☑ | PASS |
| T-03 | AC-02 | unit | `TaskLogQuerySchema` accepts `all`, `tasks`, `events`, omitted; rejects `bogus`. | ☑ | PASS |
| T-04 | AC-03 | contract | `type: "all"`: both kinds, newest first, strictly ordered across pages, `total` equals the concatenated length. | ☑ | PASS |
| T-05 | AC-03 | contract | `type: "tasks"` has no plain events; `type: "events"` has only plain events, none with a status. | ☑ | PASS |
| T-06 | AC-03 | contract | Each `status` filter returns tasks only, with and without `type: "all"`; with `type: "events"` → `items: []`, `total` 0; `q` combined with `type`. | ☑ | PASS |
| T-07 | AC-04 | contract | `getOccurrence` for a plain-event key: no status, actor or completedAt; another client's plain-event key → `undefined`. | ☑ | PASS |
| T-08 | AC-04 | contract | `getTodayOccurrences` with the new option returns the reference day's plain events and tasks, oldest first, Margaret only. | ☑ | PASS |
| T-09 | AC-05 | unit | Fixtures: plain-event rows in the reference week, on the reference day and in the calendar data; mode agreement with their events; key rules; determinism. | ☑ | PASS |
| T-10 | AC-06 | contract | Callers without the new options: Margaret's log total 137, the design rows, Overdue and Recent activity rows, and `getTodayOccurrences` results unchanged; existing UI-00 and UI-04 tests unchanged and green. | ☑ | PASS |
| T-11 | AC-07 | component | Day timeline, week grid and month grid: a plain event at each density has the neutral bar, no check or alert icon, "Event" where the tier shows a status word, and "Event" in its accessible name. | ☑ | PASS |
| T-12 | AC-07 | component | The same surfaces still draw Planned, Done and Overdue exactly as before (existing tests plus one side-by-side case). | ☑ | PASS |
| T-13 | AC-08 | component | Event popover for a plain event: "Event" label, no status icon, no "Done ·", no completion time. | ☑ | PASS |
| T-14 | AC-09 | component | Lists: the "Event" label (word, no icon, neutral tokens) in the place of a `StatusPill`; `StatusPill` and `ActivityRow` unchanged for the three statuses. | ☑ | PASS (`src/components/shared/lists/activity-row.plain-events.test.tsx`) |
| T-15 | AC-10 | component | Switch: role, `aria-checked`, accessible name, 44px class, "On"/"Off"; click, Space and Enter toggle; controlled value respected. | ☐ | NOT RUN |
| T-16 | AC-11 | component | `EventForm` with the hide-Status option: no Status group, submits without a status; without it, existing behaviour (existing tests unchanged). | ☐ | NOT RUN |
| T-17 | AC-12 | axe | Calendar, lists and forms axe files gain plain-event and switch fixtures; zero violations. | ☐ | PARTIAL (calendar and lists kits PASS; forms in Task 6) |
| T-18 | AC-12 | unit | No raw colour values in the changed kit files (token classes only). | ☐ | PARTIAL (calendar kit, `EventPill` and `activity-row.tsx` PASS; forms files added in Task 6) |
| T-19 | AC-13 | regression | `npm run verify` and the full Playwright suite on a fresh build are green with no existing test changed. | ☐ | NOT RUN |

Test titles must start with `[UI-05][AC-xx]`.

## Regression scope

- `npm run verify` (lint, typecheck, format, unit, component, integration) and the full Playwright suite on a fresh build (stop any server on port 3000 first).
- Real-browser check of the kit preview pages with a 1920 → 768 width sweep.

## Test data

- Margaret (`MARGARET_CLIENT_ID`), `REFERENCE_DATE` Mon 30 Nov 2026 09:00 Melbourne, Afternoon walk `event-margaret-walk` (`automatic`); Robert's rows for isolation.
