# Progress — FAM-UI-08 Family event cost fields (UI)

Status: READY FOR PR
Owner: Dhruv Verma
Branch: `feature/family-ui-event-cost` (created from `origin/family-dev` at 2411316)
PR target: `family-dev`
Last updated: 2026-09-25

## Blockers
- None. FAM-UI-05 merged to `family-dev` (PR #92); OQ-39 is non-blocking (documented defaults apply).

## Dependencies status
- FAM-UI-03 — MERGED TO DEV
- FAM-UI-05 — MERGED TO DEV (PR #92)

## Completed
- Tests first (T-01 to T-06), then implementation, on 2026-09-25 (commits `test(family): …`, `feat(family): …`).
- Cost field and Paid from picker (`event-cost-fields.tsx`), validation and money parsing (`event-cost.ts`), wired into the Add / Edit event screen and both pages.
- `CareEvent` gained optional `cost` and `bucketId`; Margaret's Physiotherapy carries $90 from NDIS (FD-01).

## In progress
- None

## Remaining
- Human review, then PR (needs the human's approval to open).

## Acceptance criteria status
- 6 / 6 MET (AC-01 to AC-06)

## Tests
- Written: 6 / 6 (T-01 to T-06 in `event-cost.test.ts`, `event-cost-fields.test.tsx`, `event-form-cost.test.tsx`)
- Passing: all (`npx vitest run src/features/family-event-form`: 4 files, 53 tests)
- Failing: 0 of ours. Full `npm run test`: 1662 passed, 1 failed (the `day-timeline` test above, pre-existing)
- Last run: 2026-09-25. Also: `npm run typecheck` clean; `npm run lint` 0 errors (3 pre-existing warnings); `prettier --check` clean; FAM-UI-03 e2e (`family-event-form.spec.ts`) 6 passed; real-browser sweep 1920/1440/1280/1024/768 of Edit event: no horizontal overflow, no console errors
- Tests-first evidence: before any production code, all 3 new suites failed with "Failed to resolve import @/features/family-event-form/event-cost" (commit `test(family): FAM-UI-08 …`)

## Files changed
- `src/features/family-event-form/`: `event-cost.ts`, `event-cost-fields.tsx`, `event-form-screen.tsx`, three test files
- `src/app/(family)/family/[clientId]/events/new/page.tsx`, `.../[eventId]/edit/page.tsx`
- `src/types/domain.ts` (`CareEvent.cost`, `CareEvent.bucketId`) and `src/mocks/fixtures.ts` (Physiotherapy cost): Lane S folders, FD-01
- This feature's docs

## Decisions
- FD-01 contract fields and fixture; FD-02 cost checked by the screen; FD-03 local radio group; FD-04 non-blocking defaults (OQ-39 wording).

## Problems encountered
- One test bug of my own, fixed before implementation was green: a `rerender` kept the harness state, so a "no cost" case still held "90" (`key` added). No existing test changed.
- `src/components/shared/calendar/day-timeline.test.tsx` ("renders the whole day so any hour can be scrolled to") fails on `family-dev` without these changes too; not touched here.

## Assumptions
- Phase 1 amounts are dollars as a JS number; `numeric(12,2)` arrives with F0-11 / F0-12.

## Next action
- Human reviews the screen (proposed wording, HUMAN REVIEW), then approves opening the PR to `family-dev`.

## Ready for PR
- No
