# Decisions — ADM-UI-01 Admin Home screen

## FD-01 — Uncommitted isolated preview
- Date: 2026-09-22
- Human approved a separate worktree from origin/admin-dev, preserving the existing Family changes, and deferring all commits and pushes until visual review.
- Worktree: ../care-compass-admin-preview; branch: feature/admin-ui-home.
- Claim, tests-first commits and END SESSION commit/push are deferred by this explicit instruction. No remote claim has been made.

## FD-02 — Missing Admin contract
- Date: 2026-09-22
- Human explicitly approved adding the small Admin query and fixture in shared/backend folders.
- Added src/server/admin/queries.ts and its contract tests, plus src/mocks/admin-home.ts. Existing data-source selection is reused; Supabase mode still throws until ADM-01.
- Synthetic values follow the Admin Home design: Clients 42, Staff 17, four overdue rows.

## FD-03 — Admin overdue composition
- The existing AlertListCard accepts only title/date rows; it cannot express client/event/nurse columns or the design header.
- Compose an Admin-local card from CardShell, StatusPill and Icon; reuse StatCard and state primitives. Shared components remain unchanged.
- OQ-37 non-blocking default: decorative chevron only, no row navigation until its destination is designed.

## FD-04 — Next.js error recovery API
- Installed Next.js 16.3.3 documentation uses retry for error.tsx recovery; follow that API.
- No test expectations changed.

## Preview runtime
- DATA_SOURCE=mock, with process-local dummy Supabase URL http://127.0.0.1:54321 and placeholder anonymous key solely to satisfy the existing environment validation.
- No real credentials, database, persistence or new dependencies.
- Dependencies reuse the existing local node_modules via a junction. Next runs with webpack on port 3100.

## CHG-006 — Human-requested preview revision, 2026-09-22
- Equal 8px left/right overdue-row padding; removed desktop left-padding override.
- Caption changed from across all clients to Across all Clients at the human's request.
- Upcoming shifts added from supplied screenshot, through the approved mock query/fixture and shared DataTable.
- T-02 caption assertion changed only to match the requested wording. HUMAN REVIEW: test expectation changed. No assertion removed or weakened.
- Added AC-04 tests for shift columns/assignment content and the empty state. Tests failed for the missing section before implementation.
