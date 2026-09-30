# Decisions — ADM-06 Admin — Manage: staff and client selection

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| — | None. FD-02 and FD-04 confirmed by the human 2026-09-30 | No | — |

## Feature decisions log

### FD-01 — Contract shape
- Date: 2026-09-30
- Decision: extend `getAdminManage` with an optional `{ staffSearch, clientSearch }`. Supabase mode reads carers (`profiles`, role carer) and `clients` under RLS, filtered server-side with a case-insensitive contains match on first or last name (D32). `referenceDate` and `shifts` stay as they are (mock) or empty in Supabase mode until ADM-07 wires shifts.
- Reason: keeps one contract function; ADM-07 later changes the same function, so it is sequenced after this PR (CLAUDE.md §3).
- Human confirmation required: no.

### FD-02 — Search and selection state live in the URL
- Decision: params `staff`, `client` (ids, PRD) and `staffQ`, `clientQ` (search, PROPOSED names). Enter in a search box does `router.replace`, keeping the other params. Initial selection is empty: the design-time Aisha/Margaret preselection from ADM-UI-02 goes away, so the URL is the single source of truth.
- Human confirmation required: yes. CONFIRMED by the human, 2026-09-30.

### FD-03 — AC-05 added (PROPOSED)
- One staff and one client at most (PRD Error/Edge Cases) and URL round trip were not covered by an AC.

### FD-04 — AC-06 added (PROPOSED): only active carers are listed
- Reason: a deactivated carer (ADM-03) should not be rostered. ADM-02's Staff screen still lists them; only Manage filters.
- Human confirmation required: yes. CONFIRMED by the human, 2026-09-30.

### FD-05 — Row semantics stay listbox/option
- PRD says radio-group; the shared `SelectableListRow` (UI-03, not editable here) uses `role="option"` inside a `listbox`, with arrow-key navigation from ADM-UI-02. Kept. Flag for a shared PR if radio semantics are wanted.

### FD-06 — Existing ADM-UI-02 tests that will need changing during implementation
- `manage-screen.test.tsx`: initial-selection tests (AC-01, AC-02, AC-03 overlap, no-repeat) and client-side filter test assume Aisha/Margaret are preselected and filtering is local; `manage-queries.test.ts`: 'refuses Supabase mode' assertion. Change only as needed, record test ID/before/after here and flag **HUMAN REVIEW: test expectation changed** in PROGRESS.md and the PR.

Changes made (2026-09-30), all flagged HUMAN REVIEW in PROGRESS.md:
- `manage-screen.test.tsx` "selects the initial staff and client…", "Clear removes both selections", "warns on a true overlap…", "validates custom times…", "resets local assignments…", "has no Repeat control", a11y and empty-lists tests: before, selection was local state preselected to the first rows; after, the file mocks `next/navigation` and passes `selection={{ staffId: "aisha", clientId: "margaret" }}`. Reason: FD-02, selection now comes from the URL. Clear now asserts `router.replace("/admin/manage")`; the overlap test switches carer by rerender.
- "filters each list and handles no results": before, typing filtered locally; after, typing does not filter and a server search with no rows shows "No clients found". Reason: search is server-side on Enter (D32). Assertion of local filtering removed, covered by T-06/T-07.
- `manage-queries.test.ts` "refuses to disguise Supabase mode": before `rejects.toThrow("not implemented")`; after `rejects.toThrow()` (the branch is implemented, outside a request it fails reading cookies). Still proves mock data is not returned.
- `manage-selection.test.tsx` T-05 (own test, test bug): compared `textContent`, which includes avatar initials ("DKDaniel Kelly"); now compares by accessible name.
- `manage-screen.test.tsx` "validates custom times and treats touching intervals as non-overlapping" (test bug, FD-07): before, after assigning 13:00-15:00 it expected an alert naming 13:00 - 15:00; after, it expects no alert. Reason: the overlap check ran against the shift just created, so every first assignment warned about itself. Added "a first assignment shows only the success message, and a repeat warns".
- `manage-screen.test.tsx` "resets local assignments on remount" (test bug, FD-07): before it asserted the self-overlap alert after one click; after it asserts the "Shift assigned" status.

### FD-07 — Self-overlap warning fix and assign-shift layout on this branch
- Date: 2026-09-30
- Context: hand-testing showed a red overlap warning and the green success message together after the first click. The live overlap check included the shift just added to local state. Separately, the calendar left a wide empty area beside it.
- Decision: the just-assigned shift is excluded from the warning until the form changes (then it counts as an ordinary shift). Time slot, custom times and the overlap warning moved into a column beside the calendar at 1280px and wider; below that it stacks.
- Reason: human asked to fix it here rather than wait for ADM-07. Assignment is still Phase 1 local state only; nothing is saved (ADM-07).
- Alternatives considered: leave both for ADM-07 (recommended, declined by the human).
- Consequences: two ADM-UI-02 test expectations changed (above). Flagged HUMAN REVIEW in PROGRESS.md. ADM-07 will rewrite this form.
- Human confirmation required: no, requested in chat.
- Test changes caused: see above, flagged yes.

### FD-08 — Time picker: hour and minute dropdowns plus common shifts
- Date: 2026-09-30
- Context: human asked to replace the time-slot chips and the Custom option with dropdowns.
- Decision: Start and End each have an hour dropdown (00-23) and a minute dropdown (5-minute steps), reusing the shared `Field` select. Under them, "Common shifts" buttons (07:00-11:00, 11:00-15:00, 15:00-19:00, 08:00-16:00, 09:00-17:00) fill the dropdowns and show pressed while they match. Default 07:00-11:00. End must be after start (existing rule). Local wrapper only; `src/components/shared/**` untouched.
- Reason: human request. The 5-minute step and the two added common shifts (08-16, 09-17) are my defaults; change on request.
- Alternatives considered: 15-minute steps; overnight shifts (still rejected, end must be after start).
- Consequences: no Custom mode. ADM-07 will save the same start and end values.
- Human confirmation required: no, requested in chat (step size and preset list open to change).
- Test changes caused: "warns on a true overlap" and "a first assignment..." now press buttons named by time instead of radios (control changed, same behaviour); "validates custom times..." rewritten for the dropdowns; 2 tests added. `manage-screen.test.tsx` "Clear removes both selections" and `manage-selection.test.tsx` T-05 counted every selected `option`, which now also matches the dropdown options; scoped to the Staff/Client lists (test bug). Flagged yes.

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
