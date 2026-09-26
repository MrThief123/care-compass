# Session State — CAR-UI-03 Carer Calendar screen (UI)

Last session date: 2026-09-26
Current branch: `feature/carer-ui-calendar` (from `carer-dev`)
Worked on: CHG-031, merging the Carer Calendar into Carer Home; FD-05, one calendar size and scrollable notifications; FD-06, the red current-time line (AC-11)
What changed: Carer Home holds the D/W/M 'Shifts' calendar (Day by default) with notifications beside it from 1280px; `/carer/calendar`, `src/features/carer-calendar/` and the Carer rail Calendar item removed; tests rewritten first (FD-04)
Tests run: `npm test`, `npm run test:e2e -- --grep-invert "F0-07"`, `npx eslint .`, `npx tsc --noEmit`, Prettier on changed files
Test results: full suite 1853 passed, 5 unrelated F0-07/F0-04 integration failures ("Invalid API key"); e2e 36 passed; lint 0 errors; typecheck clean
Current blocker: None
Important discoveries: After deleting a route, `tsc` fails on stale `.next/types/validator.ts` until a `next build` (the e2e run) regenerates it.
Important decisions: CHG-031, FD-04, FD-05, FD-06
Exact next action: PR #126 (https://github.com/MrThief123/care-compass/pull/126) open to `carer-dev`; address review comments, then the human merges.
Files likely to be touched next: none
Warning for next session: `/carer/patients/[clientId]` 404s in the preview until CAR-UI-02 (PR #125) merges to `carer-dev`.
