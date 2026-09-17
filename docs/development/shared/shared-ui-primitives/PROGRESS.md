# Progress — F0-14 Core UI primitives and state components

Status: NOT STARTED
Owner: unclaimed
Lane: S — Shared kit
Sprint: SPRINT · planned D2
Branch: `feature/shared-ui-primitives` (not yet created)
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (planning pack generated)

## Blockers
- OQ-01 — Branch parent and naming for shared (foundation and cross-cutting) work

## Dependencies status
- F0-05 — NOT STARTED

## Completed
- Feature documentation drafted (Claude Chat planning pack)

## In progress
- None

## Remaining
- Icon library `lucide-react` (shadcn default) with an `Icon` wrapper (sizes 14/16/20) covering rail and card icons: home, info, calendar, dollar, sliders, patient/person, clipboard-check, bell, search, file, plus, check, alert-triangle, chevrons, x.
- Avatar (sm 28 / md 32 / lg 46; initial on brand-pale ground).
- Button (primary brand-deep fill / secondary outline / ghost link; md / lg; disabled).
- Status pill: planned (outline, 'Planned'), done (brand-pale fill, check icon, 'Done · Aisha R.'), overdue (alert outline, warning icon, 'Overdue'); never colour alone.
- Count badge (neutral / alert), Progress bar (normal brand / alert-strong).
- Card shell (neutral / alert tone with border/alert and bg/alert).
- Checkbox (checked label struck through and muted, as in Tasks panels).
- Segmented control D / W / M (default W).
- Search field with clear button and states: empty, typing, loading, no-results ('No matches for "Zoe".').
- File tile: filled (file icon + filename) and add ('+ Add file', dashed border).
- EmptyState (icon, title, body — e.g. 'All caught up / There are no overdue tasks right now.'), ErrorState ('Something went wrong / We couldn't load this page. Please try again.' + Retry), Skeletons (list rows with avatar; card grid).
- Component tests including axe accessibility assertions.

## Acceptance criteria status
- 0 / 6 MET

## Tests
- Written: 0 / 6
- Passing: 0
- Failing: 0

## Files changed
- None yet. Likely files: `src/components/ui/*`, `src/components/shared/status-pill.tsx`, `src/components/shared/file-tile.tsx`, `src/components/shared/search-field.tsx`, `src/components/shared/states.tsx`, `src/components/**/*.test.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for answers to OQ-01; then complete dependencies, run START FEATURE F0-14, and write the tests in TEST_PLAN.md first.

## Ready for PR
- No
