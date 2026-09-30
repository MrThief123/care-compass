# Test Plan — FAM-09 Family — Client info

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Titles start `[FAM-09][AC-xx]`.

## Test levels used
- **component** → `src/features/family-info/family-info-wired.test.tsx` (Vitest + Testing Library + axe). The contract (`src/server/**`) is mocked.
- **db** → `supabase/tests/family_client_info.test.sql` (pgTAP, `supabase test db`)
- **e2e** → `tests/e2e/family-client-info.spec.ts` (Playwright, local Supabase only)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01, AC-09 | e2e | Helen edits Habits, saves, sees the text, still sees it after a reload; audit row names Helen. Also in the spec: never-written section + 5,001 characters refused with draft kept (AC-03, AC-08) | ☑ | GREEN (e2e 6/6 locally, prod build, local Supabase) |
| T-01b | AC-01 | component | Save calls `saveClientInfoSection(clientId, kind, text)`, shows the new text, refreshes the route, focus returns to Edit | ☑ | GREEN |
| T-02 | AC-02 | component | Description, Habits, Medical history, Documentation cards appear in that order | ☑ | GREEN |
| T-03 | AC-03, AC-07 | component | A 'too long' refusal shows under the box, the draft stays and the old text is not replaced; a failed save does the same | ☑ | GREEN |
| T-04 | AC-04 | db | Another organisation's admin and an unlinked family member cannot insert or update Margaret's sections; Helen can; an unlinked family member cannot read; Priya (own admin) can (FD-05) | ☑ | GREEN on first run: CAR-04's migration already holds these rules |
| T-05 | AC-05, AC-06 | e2e | Helen adds 'Care plan.pdf'; the tile appears and is listed after a reload; a file over 20 MB is refused; the row has event_id null | ☑ | GREEN (e2e 6/6 locally, prod build, local Supabase) |
| T-05b | AC-05 | component | Add file posts a FormData with clientId and no eventId; a tile appears; a saved tile opens its signed URL | ☑ | GREEN |
| T-06 | AC-06 | component | A refused upload shows the server's message and adds no tile | ☑ | GREEN |
| T-07 | AC-08 | component | An unwritten section shows 'Nothing added yet.' with Edit, and family still sees all three text cards | ☑ | GREEN |
| T-08 | AC-09 | db | Helen's section saves write audit_log rows: actor Helen, role family, client Margaret | ☑ | GREEN on first run (audit trigger exists) |
| T-09 | AC-05 | db | Helen can add a client-level document row (event_id null); an unlinked family member cannot | ☑ | GREEN on first run |

Component file: 11 tests, 10 RED for the right reason (no contract call, no error under the box, no unwritten-section cards, no file input); the order test (T-02) passes already because the FAM-UI-04 UI draws the four cards. `supabase test db supabase/tests/family_client_info.test.sql`: 12/12 pass, so no migration is needed (FD-02).

## Existing tests expected to change at implementation (record in DECISIONS.md, HUMAN REVIEW)
`src/features/family-info/family-info.test.tsx` [FAM-UI-04]: the "local state only", "Save shows edited text", "blank textarea", "Add file says not available yet" and "trims stray space" cases assume nothing is saved. They move to the wired behaviour above.

## Regression scope
- Full unit/component suite, `supabase test db`, and Playwright for family and carer info before READY FOR PR. Run locally (CI is down, ci_down_actions_limits); say so in the PR.

## Test data
- pgTAP and e2e create their own rows (as CAR-04 does). Component tests use the design text fixtures from family-info.test.tsx.
