# Progress — FAM-17 Family — Info tips on main buttons

Status: READY FOR PR
Owner: Prajeet
Lane: F — Family
Sprint: SPRINT · planned D21
Branch: `feature/family-info-tips`
PR target: `main`
Last updated: 2026-10-06 (implemented, all 10 ACs MET, browser-checked)

## Blockers
- None. No open blocking decisions; the human approved scope in-session on 2026-10-06 (CHG-057).
- For the human in the PR: FD-02 (flagged additive Lane S file `src/components/ui/info-tip.tsx`), FD-04 (no Figma design, built from tokens: please check the look).
- Known: at 390px wide the tip (256px) can run over the side rail when the "i" is near the left; the app is desktop-first (REQ-N10), not fixed here.
- No existing test expectation changed. Three tests were added to existing Family suites (Home, Calendar, Budget).

## Dependencies status
- FAM-UI-01, FAM-UI-02, FAM-UI-05, UI-02 — MERGED to main.

## Completed
- Claimed; CHG-057; docs pack; tests first (failing for the right reason: modules missing), then implementation
- `InfoTip` toggletip (hover, focus, click; Esc, blur, outside click; 150ms leave grace; 44px target)
- `HELP_TEXT` map; tips on Family Home and Calendar "Enter event", Budget "Edit" and "Export" (opt-in `showHelp`, set only by the Family route pages)
- Local suites, lint, typecheck, format, real-browser check (1280 and 390 wide), status page refreshed

## Remaining
- Human review of the PR; merge by the human

## Acceptance criteria status
- 10 / 10 MET

## Tests
- Written: 10 / 10
- Passing: all
- Failing: 0
- Last run: 2026-10-06, `DATA_SOURCE=mock npx vitest run src/features src/components src/app` (see SESSION_STATE.md)
- Tests-first evidence: commits `test(family): InfoTip behaviour and help-text rules (FAM-17)` and `test(family): info tip placements (FAM-17)`, both failing on missing modules before `info-tip.tsx` and `help-text.ts` existed

## Files changed
- New: `src/components/ui/info-tip.tsx` (+ test), `src/features/family-help/help-text.ts` (+ tests `help-text.test.ts`, `info-tips.test.tsx`)
- Edited: Family Home (`enter-event-link.tsx`, `family-home-view.tsx`), Calendar (`calendar-toolbar.tsx`, `family-calendar-view.tsx`), Budget (`family-budget-view.tsx`), the three Family route pages
- Docs: DECISIONS.md (CHG-057), DEVELOPMENT_PLAN.md, PRD.md §17, `care-compass-status.html`, this pack

## Decisions
- FD-01 to FD-05

## Next action
- Push and open the PR once the human approves (docs/DEVELOPMENT_WORKFLOW.md §7)

## Ready for PR
- Yes, pending human approval
