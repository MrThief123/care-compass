# Progress — F0-14 Core UI primitives and state components

Status: READY FOR PR
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D2
Branch: `feature/shared-ui-primitives`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-18

## Blockers
- None (OQ-01 ANSWERED 2026-09-17)

## Dependencies status
- F0-05 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Icon library `lucide-react` with an `Icon` wrapper (sizes 14/16/20) covering: home, info, calendar, dollar, sliders, person, clipboard-check, bell, search, file, plus, check, alert-triangle, chevron-left/right/up/down, x.
- Avatar (sm 28 / md 32 / lg 46; initials on brand-pale ground).
- Button extended (primary brand-deep fill / secondary outline / ghost link; md / lg; disabled) — `destructive` variant retained from F0-05.
- Status pill: planned (outline, 'Planned'), done (brand-pale fill, check icon, 'Done · <full name>' per PD-038 — see FD-02), overdue (alert outline, warning icon, 'Overdue'); status conveyed by icon + text, never colour alone.
- Count badge (neutral / alert), Progress bar (normal brand / alert-strong, as an accessible `progressbar`).
- Card shell (neutral / alert tone with border/alert and bg/alert).
- Checkbox (checked label struck through and muted, ≥44px tap target via label padding).
- Segmented control D / W / M (uncontrolled default W; controlled via `value`/`onChange`), `radiogroup`/`radio` roles.
- Search field with clear button and states: empty, typing, loading (`role="status"`), no-results ('No matches for "Zoe".').
- File tile: filled (file icon + filename, optional onClick) and add ('+ Add file', dashed border).
- EmptyState, ErrorState (+ Retry), Skeletons (ListRowSkeleton, CardGridSkeleton).
- Component tests including axe accessibility assertions for every primitive.
- Fixed a pre-existing test-infra gap: `vitest.setup.ts` had no Testing Library `cleanup()` wired to `afterEach`, so multi-`it()` test files leaked DOM between tests (only surfaced once a component had >1 test). Also fixed `jest-axe`'s `toHaveNoViolations` being double-wrapped in `expect.extend`.

## In progress
- None

## Remaining
- None — full PRD Scope implemented.

## Acceptance criteria status
- 6 / 6 MET

## Tests
- Written: 6 / 6 (plus additional coverage for uncontrolled/controlled SegmentedControl, SearchField clear/loading/empty states, EmptyState rendering)
- Passing: all (26 new; 91/91 full suite via `npm run test`)
- Failing: 0

## Files changed
- `src/components/ui/icon.tsx`, `avatar.tsx`, `button.tsx` (extended), `count-badge.tsx`, `progress-bar.tsx`, `card-shell.tsx`, `checkbox.tsx`, `segmented-control.tsx` (+ `.test.tsx`), `primitives.axe.test.tsx`
- `src/components/shared/status-pill.tsx` (+ `.test.tsx`), `search-field.tsx` (+ `.test.tsx`), `file-tile.tsx`, `states.tsx` (+ `.test.tsx`)
- `vitest.setup.ts` (axe matcher wiring + RTL cleanup fix), `package.json`/`package-lock.json` (lucide-react, jest-axe, @types/jest-axe)

## Decisions
- See DECISIONS.md
- **HUMAN REVIEW: test expectation changed** — FD-02: AC-01/T-01 changed from 'Done · Aisha R.' to 'Done · Aisha Rahman' (full name) to match confirmed root decision PD-038, which postdates and supersedes the original AC text (same fix already applied by UI-00/FD-01).

## Problems encountered
- `jest-axe`'s `toHaveNoViolations` export is already a matchers object (`{ toHaveNoViolations: fn }`); wrapping it again as `expect.extend({ toHaveNoViolations })` nests it one level too deep and fails at runtime (`expectAssertion.call is not a function`). Fixed by calling `expect.extend(toHaveNoViolations)` directly.
- Testing Library's auto-cleanup between tests never ran because `vitest.config.ts` sets `globals: false`; the button test (F0-05, one `it()`) never exposed it, but any file with 2+ `it()` calls leaked DOM across tests. Fixed with an explicit `afterEach(cleanup)` in `vitest.setup.ts`.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- Visual styling (colours, spacing, borders) follows the tokens in `src/styles/tokens.css` and the PRD's prose description of each variant; exact Figma pixel values were not re-verified node-by-node against the Figma file in this session. Flag for design review before/at PR.

## Next action
- Ready for PR. Suggest also reviewing FD-02 (Status pill full-name text change) since it's a flagged test-expectation change.

## Ready for PR
- Yes
