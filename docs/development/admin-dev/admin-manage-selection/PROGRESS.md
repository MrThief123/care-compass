# Progress — ADM-06 Admin — Manage: staff and client selection

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D9
Branch: `feature/admin-manage-selection`
PR target: `main`
Last updated: 2026-09-30 (claimed)

## Blockers
- None recorded at planning time

## Dependencies status
- F0-06 — MERGED
- ADM-UI-02 — MERGED

## Completed
- Branch claimed; docs updated (PR target main, full names, AC-05/AC-06 proposed, FD-01..FD-06).
- Tests written first and run red (2026-09-30).
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Route `/admin/manage`; Staff column (290px) 'Search staff'; Clients column (290px) 'Search clients'.
- Selectable list rows: avatar + name; selected = solid #07727D with white text and check; hover = tint.
- Assign shift panel header with summary 'Aisha Rahman → Margaret' and 'Clear' (panel body is ADM-07).
- Selection state in URL (`staff`, `client`).

## Acceptance criteria status
- 0 / 6 MET (AC-05, AC-06 PROPOSED, see DECISIONS FD-03/FD-04)

## Tests
- Written: 8 of 8 (T-01..T-08) — 12 component/unit cases + 4 integration cases
- Failing for the expected reason: 14 (10 component/unit, 4 integration, run against local Supabase)
- Passing: 2 (T-01 regression guard, blank-search case of T-07)

## Files changed
- Tests: `src/features/admin-manage/manage-selection.test.tsx`, `src/server/admin/manage-queries.search.test.ts`, `tests/integration/admin-manage-selection.test.ts`
- Likely production files: `src/app/(admin)/admin/manage/page.tsx`, `src/features/admin-manage/selection-columns.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implement in a fresh session (see SESSION_STATE.md). Confirm FD-02 and FD-04 with the human first.

## Ready for PR
- No
