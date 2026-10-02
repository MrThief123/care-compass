# Decisions — INT-05 Access-control regression matrix

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

None. OQ-01 (branch parent and naming for shared work) is ANSWERED project-wide by CHG-036 (root DECISIONS.md): every feature, shared or dashboard, branches from and PRs to `main`. The row this feature's planning pack originally listed for OQ-01 is superseded by that change.

## Feature decisions log

### FD-01 — Pre-existing unrelated test failures observed while running the full regression suite
- Date: 2026-10-02
- Context: Running the full integration and Playwright e2e suites to check for regressions (CLAUDE.md §5 step 8) surfaced: 2 integration failures (`shared-dev-seed-data.test.ts` [F0-16][AC-01], `shared-sign-up.test.ts` [F0-17][AC-04]) and 17 e2e failures across CAR-04/06/07, FAM-08/09 and INT-02/03 specs (document uploads, task-completion timing, shift journeys).
- Decision: Not fixed in this feature. The 2 integration failures were confirmed to fail identically run in isolation. For all 19, `git status` on this branch shows zero changes to `src/**` or any migration — only this feature's own docs and one `package.json` script line — so none of them can be caused by this branch's changes.
- Reason: Out of this feature's scope and folder ownership (CLAUDE.md §4.2) — they belong to F0-16, F0-17, CAR-04/06/07, FAM-08/09 and INT-02/03's own code, not INT-05's.
- Alternatives considered: Fix inline — rejected, would touch another feature's files without claiming it.
- Consequences: PR notes these as pre-existing red, flagged for whoever next claims F0-16/F0-17 follow-up work (or a human) to investigate.
- Human confirmation required: no (informational record only, no behaviour of this feature changed)
- Test changes caused (if any): none

<!-- Template
### FD-01 — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
