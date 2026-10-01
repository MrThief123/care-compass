# Decisions — CAR-06 Carer — Mark tasks done

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-09 | Carer access model | YES | (ANSWERED, PD-041/CHG-027) Assignment created automatically on first shift and ended by admin or transfer; edits allowed only within [shift start, shift end); carers may create/edit events and client info only during shift. |
| OQ-10 | Status behaviour and undo | YES | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |
| OQ-33 | Carer calendar and task semantics | YES | Decide: (a) blocks = shifts or events; (b) whether events have checklist sub-tasks and who authors them; (c) Carer Home scope. |
| OQ-34 | Event notes and comments | no | Parked (PL-21) until designed. |

## Feature decisions log

Blocking OQ-09, OQ-10 and OQ-33 are ANSWERED in root DECISIONS.md (PD-041, PD-044 as amended by CHG-009, CHG-025/026). OQ-34 (comments) stays parked.

### FD-01 — CAR-06 wires Home, Calendar and Care log, with an additive base path in Lane F files
- Date: 2026-10-01
- Context: the carer Calendar tab is a 'Coming soon' placeholder, and the Family modules hardcode `/family/…` links.
- Decision: see root CHG-043. Optional `basePath` and read-only flags, defaults unchanged.
- Alternatives considered: a copy of the views under `carer-patients` (rejected: ~1,500 duplicated lines, second pattern); Calendar only (rejected by the human).
- Human confirmation required: done (Dhruv Verma, 2026-10-01).

### FD-02 — Task detail opens read-only inside the carer area (assumption)
- Date: 2026-10-01
- Context: Care log and Calendar rows open Task detail; no carer route exists, and a `/family/` link would bounce the carer.
- Decision: add `/carer/patients/[clientId]/tasks/[occurrenceKey]` reusing the Family Task detail with Edit event hidden. No ticking there.
- Human confirmation: ACCEPTED by the human, 2026-10-01 (read-only is fine).

### FD-03 — Test mapping changed from the planning pack
- Date: 2026-10-01
- Context: the pack's T-02 and T-03 targeted Carer Home, which CHG-025/026 removed from this feature.
- Decision: T-01 to T-03 retargeted at the patient's Calendar tab; T-04 to T-08 added for AC-04 to AC-08. No test existed, so no HUMAN REVIEW flag is needed.

### FD-04 — Obsolete CAR-UI-02 holding-tab test removed (HUMAN REVIEW: test expectation changed)
- Date: 2026-10-01
- Context: `src/features/carer-patients/carer-patients.test.tsx` had `[CAR-UI-02][AC-08] the %s tab shows 'Coming soon' and no controls` for Home, Calendar and Care log. CHG-043 replaces those placeholders with the real screens, so the assertion is false by design.
- Decision: the three-case `describe` ("Home, Calendar and Care log holding tabs") and its three page imports are removed. Before: each tab rendered 'Coming soon', no buttons, no checkboxes, no axe violations. After: no such test; the tabs are covered by `carer-complete-task.test.tsx` (T-02, T-04, T-06, T-07). `ComingSoon` is deleted, nothing else used it.
- Reason: recorded requirement change (CHG-043).
- Test changes caused: CAR-UI-02 AC-08 test, removed; flagged for review: yes. The axe check on those three screens is not carried over; worth adding in a follow-up.
- Human confirmation: ACCEPTED by the human, 2026-10-01. Still flagged HUMAN REVIEW in the PR.

### FD-05 — Home loader keeps only overdue rows in the Overdue list
- Date: 2026-10-01
- Context: `T-06`/`T-07` mock `getTaskLog` without honouring the `status` filter, so a Planned task landed in the Overdue card as well as Today, and the screen showed it twice.
- Decision: `loadFamilyHomeData` filters `overdue.items` to `status === "overdue"` before sorting. With the real contract (which already filters) it changes nothing; Family tests unchanged and green.
- Human confirmation required: no (additive, Lane F file, within CHG-043's instruction).

### FD-06 — No Add event link on the carer Calendar, on shift or not
- Date: 2026-10-01
- Context: the session brief said the Add event link exists on shift for the Calendar; PRD Scope, AC-07, T-07 and CHG-043 say there is no Add event link on any carer screen (CAR-07 is post-sprint).
- Decision: followed the PRD, AC-07 and the test (never shown). `FamilyCalendarView` takes `canAddEvent`, which the carer route sets to false.
- Human confirmation: RESOLVED 2026-10-01. The human wants carer-created events, synced to the client and family, but as CAR-07 (Carer — Add and edit events), not CAR-06. No Add event link in this PR.

### FD-07 — Home cannot load real data until FAM-01; e2e T-01's last step depends on it
- Date: 2026-10-01
- Context: `getTodayOccurrences` is `notImplementedForSupabase` on `main` (FAM-01, unclaimed). Family Home and the carer Home therefore show their error state against Supabase, with this feature or without it. T-01 ends by opening `/family/<id>/home`, so it fails there.
- Decision: no change to the test or to `src/server/events/queries.ts` (FAM-01's contract function). With that last step pointed at `/family/<id>/calendar` in a throwaway copy, T-01 and the AC-02 e2e both pass. Proposed fix, for the human: change `/home` to `/calendar` on T-01's last navigation, or wait for FAM-01.
- Resolved: FAM-01 was merged on 2026-10-01; Home loads and T-01 passes unchanged.

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
