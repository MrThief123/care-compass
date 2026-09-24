# Progress — FAM-UI-04 Family Info screen (UI)

Status: READY FOR PR
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D5
Branch: `feature/family-ui-info` (created from `origin/family-dev` at 02c7fa7)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None. The contracts and fixtures the screen needs (`src/server/**`, `src/mocks/**`, outside Lane F) were confirmed by the human on 2026-09-25 as CHG-018 (root DECISIONS.md), recorded in FD-02.

## Dependencies status
- F0-15 — MERGED
- UI-03 — MERGED

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Claimed (`docs(family-ui-info): claim`)
- CHG-018 (contract reads + Family · Info fixtures) and FD-01/FD-02 recorded
- Tests written first, run, and confirmed red for the right reason
- Contracts, mocks and fixtures: `getClientInfoSections`, `getClientDocuments`, `CLIENT_INFO_SECTIONS`, the two client documents
- Route `/family/[clientId]/info` with `loading.tsx`, in the family layout
- Description, Habits, Medical history and Documentation cards, in that order, with the design text (local composition, FD-01)
- Inline edit with Save/Cancel per text card, in local state (PROPOSED interaction, FD-04)
- Documentation tiles ('Care plan.pdf', 'Medication schedule.pdf', 'Add file') reusing the square tiles, name only (FD-03, FD-05)
- Loading skeleton, empty state and error state with Retry (FD-06)
- Data only through `src/server/**` contract functions (mock data source); nothing imports `src/mocks` from `src/app` or `src/features`
- Real-browser checks: geometry against `family-04-info.png`, width sweep 1920 to 768, edit, empty and loading states, no console errors
- Design-match pass on card padding and spacing (FD-07)
- Duplicate client name and summary block removed from the page body at the human's request (FD-08)

## In progress
- Nothing. Waiting for the human's "yes" to open the PR.

## Remaining
- Open the PR to `family-dev` after the human approves (CLAUDE.md §8; the docs update ships in the same PR). A side-by-side screenshot of the design and the implementation goes on the PR (not committed to the repo).

## Acceptance criteria status
- 3 / 3 MET (AC-01, AC-02, AC-03)

## Tests
- Written first: 3 / 3 acceptance criteria, plus the PRD cases (inline edit, states, wrapping, a11y, contracts) — see TEST_PLAN.md
- Passing: all. `npx vitest run src tests/unit`: 104 files, 1230 tests
- Failing: none of this feature's. One e2e spec fails intermittently on `family-dev` itself (see TEST_PLAN.md Results)
- Files: `src/features/family-info/family-info.test.tsx`, `src/features/family-info/info-data.test.ts`, `src/server/clients/queries.test.ts`, `src/mocks/queries/clients.test.ts`, additions to `src/server/documents/queries.test.ts` and `src/features/family-task-detail/document-tile.test.tsx` (additive outside this feature; inside it, FD-08 changed or removed the tests of the removed summary block)

## Files changed
- Docs: root `DECISIONS.md` (CHG-018), this feature's `DECISIONS.md` (FD-01 to FD-08), `ACCEPTANCE_CRITERIA.md`, `TEST_PLAN.md`, `PROGRESS.md`, `SESSION_STATE.md`
- Tests: as listed above
- Contracts and mocks (CHG-018): `src/mocks/fixtures.ts`, `src/mocks/queries/{clients,documents}.ts`, `src/server/{clients,documents}/queries.ts`
- Shared within Lane F: `src/features/family-task-detail/document-tile.tsx` (prop type widened, FD-03)
- New: `src/features/family-info/{documentation-card,family-info-view,info-data,info-error-state,info-section-card,info-skeleton}.ts(x)`, `src/app/(family)/family/[clientId]/info/{page,loading}.tsx`

## Decisions
- See DECISIONS.md (FD-01 to FD-08) and root DECISIONS.md CHG-018

## Problems encountered
- I told the human the renamed fixture "Care plan 2026.pdf" had only a schema check as its consumer. That was wrong: the name also appears in a carer notification fixture (`notif-aisha-2`) and as an unrelated test's own literal. Corrected in-session; the notification is left as its design draws it (CHG-018 Impact, FD-02).
- Running `npm run test:e2e` here also ran `tests/e2e/auth.spec.ts` (F0-07) against the hosted Supabase project in `.env.local`. That spec is written for a local stack. Both specs failed at sign-in, and the family one left one orphan `E2E Client` row (`clients`, no organisation, no family link, created 2026-09-24 21:58 UTC). 22 earlier orphans from runs on 22–24 Sept are there too, so the spec's clean-up (it deletes only the auth user) does not remove the client row. Nothing was deleted; raised with the human. Later e2e runs excluded F0-07.
- `shared-app-shell` "keeps header text inside the header bar" at 480px and 338px is flaky on `origin/family-dev` (see TEST_PLAN.md Results). Not caused by this branch.
- The shared `DocumentTile` border is slightly lighter than the design's (FD-03). Left as it is, flagged for design review.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- OQ-38 and OQ-26 are non-blocking; their proposed defaults are used (OQ-38: the design as drawn; OQ-26 is not exercised, nothing is uploaded).

## HUMAN REVIEW
- **Test expectation changed** (FD-08): the client summary block was removed from the body at the human's request, so the tests that asserted it were changed or removed; each is listed in FD-08 with before and after. It departs from `family-04-info.png`, which draws the block; the PR's side-by-side will differ by it.
- Design gaps built from tokens, please review: FD-03 (tile border thickness), FD-04 (editing state, Save/Cancel layout, "Nothing added yet."), FD-05 ('Add file' notice), FD-06 (empty-state wording), FD-07 (kit hairline border, 15px padding).
- The PRD says "`ClientInfoView`"; the screen is a local composition instead (FD-01).
- Notification `notif-aisha-2` says "Care plan 2026.pdf" while Family · Info says "Care plan.pdf" (FD-02).

## Next action
- Announce readiness to the human; open the PR to `family-dev` only after their "yes".

## Ready for PR
- Yes (once the branch is pushed; PR not opened)
