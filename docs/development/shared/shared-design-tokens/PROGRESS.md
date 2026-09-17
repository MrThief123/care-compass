# Progress — F0-05 Design tokens, typography and base styles

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D1
Branch: `feature/shared-design-tokens`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-17 (implementation complete, tests green)

## Blockers
- None — OQ-01 answered (PD-030, root DECISIONS.md)

## Dependencies status
- F0-02 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Colour tokens (exact hex from Figma variables) as Tailwind v4 `@theme` CSS variables in `src/styles/tokens.css`, plus a `tokens.fixture.json` ground truth backing T-01
- shadcn/ui semantic variables (`--color-background`, `--color-primary`, `--color-ring`, etc.) mapped onto the Figma tokens
- Type ramp utilities (`text-title-page`, `text-title-section`, `text-title-card`, `text-metric-large`, `text-metric-medium`, `text-body-emphasis`, `text-body-default`, `text-body-small`, `text-body-secondary`, `text-label-caps`) via Tailwind v4 `@utility`
- IBM Plex Sans wired via `next/font/google` in `src/app/layout.tsx` (`--font-ibm-plex-sans`), consumed by `--font-sans` in tokens.css; Tailwind's built-in `tabular-nums` utility is available for times/currency/counts (no custom CSS needed)
- Spacing scale `--space-1`..`--space-9` (4–48px) and radius tokens `--radius-pill/control/card/inset/full`
- Rail gradient utility `.bg-rail-gradient` (vertical bg/brand-deep → bg/brand)
- Global visible `:focus-visible` ring in `globals.css`; body base font-size 14px (Body/Default), never below Body/Small (13px)
- shadcn/ui initialised (`components.json`, `src/lib/utils.ts` `cn` helper, `clsx`/`tailwind-merge`/`class-variance-authority` deps — FD-01) with a minimal `Button` primitive (`src/components/ui/button.tsx`) proving the token mapping and satisfying AC-04; the full primitives kit is F0-14
- Contrast utility (`src/lib/contrast.ts`, WCAG relative luminance/ratio) and an approved foreground/background pairs list (`src/styles/contrast-pairs.ts`) satisfying AC-02/AC-03

## In progress
- None

## Remaining
- None for this session's scope

## Acceptance criteria status
- 4 / 4 MET (AC-01, AC-02, AC-03, AC-04)

## Tests
- Written: 4 / 4 (T-01..T-04, written before implementation; confirmed failing on missing `tokens.css`/`button.tsx` before implementing)
- Passing: 4
- Failing: 0

## Files changed
- `src/styles/tokens.css`, `src/styles/tokens.fixture.json`, `src/styles/tokens.test.ts`, `src/styles/contrast-pairs.ts`, `src/styles/contrast.test.ts`, `src/lib/contrast.ts`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, `src/components/ui/button.test.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, `components.json`, `package.json`, `package-lock.json`

## Decisions
- See DECISIONS.md (FD-01 — shadcn/ui utility dependencies)

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md; radius numeric values (pill 6, control 8, card 10, inset 8) taken from PRD.md as ARCHITECTURE.md §4 records the same range and F0-01 validation found no more precise Figma export.

## Known limitations
- Type ramp utilities (`text-title-page` etc.) and the spacing scale have no dedicated AC/test in this feature's TEST_PLAN.md (only colour tokens, contrast and focus ring are covered by AC-01..04); they are implemented per PRD Scope and verified by `npm run build`, but a future controlled change could add explicit coverage if the human wants it.

## Next action
- None — feature complete, ready for PR review.

## Ready for PR
- Awaiting human approval to open the PR (per PR approval gate).
