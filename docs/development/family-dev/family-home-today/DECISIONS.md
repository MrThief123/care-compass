# Decisions — FAM-01 Family Home — Today day-view timeline

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-29 | Which nurse is shown on an event | YES | ANSWERED — PD-055 (Dhruv Verma, 2026-09-17): derive from the carer whose shift covers the occurrence start; '—' if none; once Done show the actor. |
| OQ-10 | Status behaviour and undo | no | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |

## Feature decisions log

### FD-01 — The screen exists; this feature wires data and the access check
- Date: 2026-10-01
- Context: FAM-UI-01 already built and tested the Today panel, timeline, empty state and error state (`src/features/family-home/**`), reading through the `src/server/**` contract. `getTodayOccurrences` has a mock branch only; under `DATA_SOURCE=supabase` it throws "not implemented".
- Decision: FAM-01 adds the Supabase branch of `getTodayOccurrences` (today's Melbourne date through the existing F0-11 `loadOccurrences`, same `type` option and ordering as the mock) and the AC-05 access check on the page. It does not redesign the panel.
- Consequences: AC-01, AC-02, AC-03, AC-04 and AC-06 are verified by FAM-01-tagged tests that pass on first run (regression guards); AC-05 and the Supabase read are the tests that fail first.
- Human confirmation required: no.

### FD-02 — `positionBlocks` is `layoutDay`
- Date: 2026-10-01
- Decision: the PRD's pure layout helper `positionBlocks()` is `layoutDay` in `src/features/family-home/today-layout.ts`. AC-03's numbers (tops 88px and 198px, heights 44px and 66px on 44px rows from 07:00) are pinned there already; T-03 re-asserts them under the FAM-01 ID.

### FD-03 — Overlapping events stack, not side by side
- Date: 2026-10-01
- Decision: the PRD's PROPOSED "render side by side" is superseded by FAM-UI-01 FD-14: overlapping occurrences stack full width and the hour scale stretches. No new work.

### FD-04 — Names are full names
- Date: 2026-10-01
- Decision: AC-01's "Aisha R." is displayed as "Aisha Rahman" (CHG-032, every displayed person name is first plus last). T-01 asserts the full name and "Done · Aisha Rahman".

### FD-05 — AC-05: the page calls `assertClientAccess` itself
- Date: 2026-10-01
- Context: the family layout runs `assertClientAccess` (F0-22), but a Next.js layout does not stop its page rendering, so the page could still fetch for an unlinked client.
- Decision: `home/page.tsx` calls `assertClientAccess(clientId)` before `loadFamilyHomeData`. It redirects (via `getLandingPath()`) and no contract read happens. No-op under mock.
- Test: T-05 (page, contract faked) plus an integration check that RLS returns nothing for the other client's family.

### FD-06 — Plain events on the Today panel
- Date: 2026-10-01
- Decision: out of scope. The panel keeps the tasks-only default of `getTodayOccurrences(clientId)`; showing plain events is not in this feature's ACs. Raise it as a parking-lot item if wanted.

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
