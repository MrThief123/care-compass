# Session State — UI-05 Plain events in the shared kit and contracts (CHG-009)

Last session date: 2026-09-24
Current branch: `feature/shared-plain-events`
Worked on: Task 4 (calendar kit).
What changed: `status-cue.ts` (`EVENT_CUE` dotted neutral bar, `occurrenceCue`), new `src/components/shared/event-pill.tsx`, `day-timeline.tsx` / `week-grid.tsx` / `month-grid.tsx` generic over the occurrence type (default `Occurrence`), `event-popover.tsx` shows `EventPill` for a plain event, `use-event-hover.ts` takes `AnyOccurrence`, month chips get `data-testid="month-grid-chip-<key>"`; preview `src/app/dev-preview-calendar-kit/` gains plain-event examples (FD-02). FD-05.
Tests run: new calendar tests (failing first, commit 4b27a71), `npm run typecheck`, eslint, `npx vitest run src` (473 passed); scratch merge of `origin/family-dev` + this branch: tsc clean, 990 passed; Playwright real-Chromium sweep of `/dev-preview-calendar-kit` at 1920/1440/1280/1024/768, Day/Week/Month + popover: no horizontal scroll, no console errors, plain events dotted bar / no icon / "Event".
Test results: green.
Current blocker: none.
Important discoveries: a solid grey bar made plain events differ from Planned tasks by colour alone in compact/week/month views — switched to a dotted bar (FD-05). The Chrome extension was not connected; Playwright was used for the browser check. Merging `main` into `family-dev` also conflicts on root `DECISIONS.md` (CHG-009 vs CHG-008), not caused by this branch. A `next dev` server for this repo was already running on port 3000.
Important decisions: FD-01, FD-02, FD-03 (answered), FD-04, FD-05 (implementation notes).
Exact next action: on the human's go-ahead, Task 5: read `src/components/shared/lists/**` and `src/components/shared/lists-cards-kit.axe.test.tsx`; write failing `[UI-05][AC-09]` / `[AC-12]` tests (T-14, lists part of T-17, add lists files to `plain-events.tokens.test.ts`); use `EventPill` where a `StatusPill` goes for a plain event; keep `StatusPill` and `ActivityRow` unchanged for tasks; preview + deep links if there's a lists preview page (none may be editable under FD-02 — only calendar and forms preview pages).
Files likely to be touched next: `src/components/shared/lists/**`, `src/components/shared/lists-cards-kit.axe.test.tsx`, `src/components/shared/plain-events.tokens.test.ts`.
Warning for next session: do not edit `src/features/**` or `src/app/**` (except the two dev-preview kit pages, FD-02); do not commit `.claude/settings.json`; no Co-Authored-By lines. CI on the failing-tests commits goes red by design (accepted by the human).
