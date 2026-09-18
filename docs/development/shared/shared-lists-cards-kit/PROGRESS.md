# Progress — UI-03 Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view

Status: IN PROGRESS
Owner: MrThief123
Lane: S — Shared kit
Sprint: SPRINT · planned D3
Branch: `feature/shared-lists-cards-kit`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-18

## Blockers
- None — OQ-01 answered (PD-030)

## Dependencies status
- F0-14 — MERGED TO DEV
- UI-00 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- All 10 scoped components, each reusing F0-14 primitives directly rather than duplicating them:
  - `DataTable` (generic columns/rows, optional chevron column)
  - `ActivityRow` (title, short date, `StatusPill`, chevron) — used by `AlertListCard`
  - `AlertListCard` (alert `CardShell`, warning icon, `CountBadge`, `ActivityRow` list, optional caption)
  - `SelectableListRow` (role="option", selected = solid brand-deep + white text + check icon; Avatar swaps to white-ground/brand-deep initials and is `aria-hidden` to avoid double-announcing the name)
  - `PersonCard` (Avatar lg + name + meta)
  - `NotificationRow` (Admin neutral / Family brand chip + message)
  - `StatCard` (label + Metric/Large value)
  - `BudgetBucketCard` (ok/warning/alert/exhausted tiers per FD-02, `ProgressBar`, `formatMoney`)
  - `TaskChecklist` (wraps `Checkbox`, which already strikes through when checked)
  - `ClientInfoView` (section cards with optional Edit, `FileTile` documents with optional Add file, gated by `canEdit`)

## In progress
- None

## Remaining
- None — full PRD Scope implemented.

## Acceptance criteria status
- 6 / 6 MET

## Tests
- Written: 15 test files' worth of cases (T-01..T-05 behavioural + T-06 axe covering all 10 components)
- Passing: all (`npx vitest run` — 116/116 repo-wide on this branch)
- Failing: 0

## Files changed
- `src/components/shared/lists/{data-table,activity-row,alert-list-card,selectable-list-row,notification-row,task-checklist}.tsx` (+ `.test.tsx` for AC-02/03/05)
- `src/components/shared/cards/{person-card,stat-card,budget-bucket-card}.tsx` (+ `.test.tsx` for AC-01)
- `src/components/shared/client-info-view.tsx` (+ `.test.tsx` for AC-04)
- `src/components/shared/lists-cards-kit.axe.test.tsx` (AC-06, all 10 components)

## Decisions
- See DECISIONS.md — FD-01 (non-blocking OQ defaults), FD-02 (BudgetBucketCard warning-tier behaviour sourced from the Figma component doc).

## Problems encountered
- None.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Push (already pushed) and open PR to `main` once a human approves (CLAUDE.md §8 — never open the PR without prior human approval).

## Ready for PR
- Yes, pending PR approval.
