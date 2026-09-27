# Decisions — FAM-04 Family Calendar — day, week and month views

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-32 | Timezone | no | Australia/Melbourne for all date logic. |

## Feature decisions log

### FD-01 — No production code changed; FAM-04 was already fully wired
- Date: 2026-09-27
- Context: FAM-UI-02 built the calendar grid (day/week/month), toolbar and URL-param state on the mock data source, but already reading through the real `src/server/events` contract (`getOccurrences`, `getToday`) rather than importing fixtures directly. F0-11 had already added `getOccurrences`'s Supabase branch, including far-future recurrence expansion and RLS scoping.
- Decision: added no new production code. Added FAM-04-labelled tests (component, unit, integration) that verify the already-existing behaviour against each of FAM-04's ACs, including a new integration test against local Supabase for AC-05 (a weekly event anchored in 2026 still occurring in the week of 5 Jan 2060) and an RLS negative case.
- Reason: the wiring gap FAM-04 was scoped to close did not exist — `getOccurrences` already had a complete, tested Supabase implementation from F0-11, and FAM-UI-02's loader already called it correctly for every view and range.
- Alternatives considered: none — this was discovered by tracing the code, not assumed.
- Consequences: none to runtime behaviour. Full regression (`npm run verify`, `npm run test:integration`, and the `family-calendar` Playwright e2e suite, 10/10) all green before and after.
- Human confirmation required: no.
- Test changes caused: none (only additions).

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
