# Session State — UI-05 Plain events in the shared kit and contracts (CHG-009)

Last session date: 2026-09-24
Current branch: `feature/shared-plain-events`
Worked on: Task 6 (forms kit). Before that: FD-07 hydration fix, Task 5 (lists kit), Task 4 (calendar kit).
What changed: new `src/components/shared/forms/switch.tsx` (`Switch`: label, checked, onChange; same markup as FAM-UI-03's `TaskSwitch`); `event-form.tsx` — `EventFormProps` is a union on `hideStatus`; with it the Status chips are absent and `onSubmit` gets `PlainEventFormValues` (no `status`); forms `index.ts` exports both. Preview `src/app/dev-preview-forms-kit/page.tsx` gains a plain-event form driven by the switch and a standalone switch (FD-02). FD-08.
Tests run: failing tests first (commit fe52cc1), then eslint, `npx tsc --noEmit`, `npx vitest run src` (500 passed, 64 files); Playwright real-Chromium sweep of `/dev-preview-forms-kit` at 1920/1440/1280/1024/768: switch 44px tall, Space and Enter toggle it, Status chips hidden while Off and shown while On, no horizontal scroll, no console errors, no Next.js issue badge.
Test results: green.
Current blocker: none.
Important discoveries: `ChipGroup` ids come from the legend, so two Status groups on one page share an id (pre-existing; only the forms preview shows two; noted in FD-08, not changed). The Chrome extension is not connected; Playwright scripts in the session scratchpad import `node_modules/playwright/index.mjs` by absolute path. A `next dev` server runs on port 3000.
Important decisions: FD-01, FD-02, FD-03 (answered), FD-04, FD-05, FD-06, FD-08 (implementation notes), FD-07 (approved bug fix); CHG-010 (root DECISIONS.md, confirmed by the human).
Exact next action: on the human's go-ahead, Task 7 (full verification) — see PROGRESS.md "Next action".
Files likely to be touched next: feature docs only, unless verification finds a problem.
Warning for next session: do not edit `src/features/**` or `src/app/**` (except the two dev-preview kit pages, FD-02); do not commit `.claude/settings.json`; no Co-Authored-By lines; do not open the PR until the human says yes. CI on the failing-tests commits goes red by design (accepted by the human).
