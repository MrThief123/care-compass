# Session State — FAM-UI-02 Family Calendar screen (UI)

Last session date: 2026-09-24
Current branch: `feature/family-ui-calendar-ticks` (from `origin/family-dev` at d7ccf71). The original `feature/family-ui-calendar` was merged in #77.
Worked on: CHG-016. The Tasks panel's local ticks are drawn on the week, day and month grids, with the signed-in person as the actor ("Done · Helen Doyle" on the detail card); untick restores the original status (FD-13).
What changed: see PROGRESS.md (CHG-016 paragraph).
Tests run: tsc; eslint; prettier; `vitest run src tests/unit` (1,150 pass); production build, then Playwright on five specs (three runs; Family tests green apart from one keyboard flake that passed 45/45 when repeated; shell header tests at 480/338px fail intermittently, also on family-dev); browser check and width sweep.
Test results: all feature tests pass.
Current blocker: none. PR not opened; awaits the human's yes.
Important discoveries: in the kit, the actor's name shows on a block only at `full` density; at 1440px the fixture blocks are smaller, so the name is on the detail card (hover or focus). The card stores the occurrence it opened with, so a test must re-focus the block to see a change. `getOccurrences` returns tasks only (plain events do not show on the calendar yet, earlier follow-up).
Important decisions: CHG-016; FD-13 (untick rule PROPOSED).
Exact next action: draft the PR "FAM-UI-02 Calendar: grids show the Tasks panel's ticks with who ticked them (CHG-016)" to `family-dev`, show it to the human, open only after their yes.
Files likely to be touched next: this folder's PROGRESS.md and SESSION_STATE.md.
Warning for next session: `.claude/settings.json` has a local uncommitted change that is not part of this feature. Do not commit it. CI (GitHub Actions) is off: run checks locally and say so in the PR. When FAM-05 wires `setOccurrenceDone`, reuse the lifted `ticks` state as the optimistic update.
