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
