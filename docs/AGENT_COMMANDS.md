# Agent Commands — Care Compass

Full definitions for the commands listed in `CLAUDE.md` §11. Read this file only when the human (or you) invokes one of these commands.

### `PROJECT STATUS`
Run `node scripts/plan-status.mjs` (add `--lane X` if the human names a lane), `git status`, `git branch -a`, `gh pr list` (if available). Report: current gate; per-lane progress; ready-to-start features; in-flight features and owners; blocked features with the OQ IDs or dependencies blocking them; open blocking decisions that would unblock the most features; git state; recommended next feature for this person and why.

### `NEXT FEATURE [lane]`
From `plan-status` "Ready to start", filtered to the person's lane if given, pick the earliest planned day, then lowest phase. Explain why; if nothing is ready, list what it's waiting on (features and decisions).

### `FEATURE STATUS <ID>`
Read the feature folder; check branch on origin and PR (`gh pr list --head feature/<slug>`). Report description, lane, target, owner, status, AC table summary, tests, blockers, decisions, next action.

### `START FEATURE <ID>`
Read feature docs → check gate, dependencies, blocking OQs, owner (stop if any fail) → update parent → create/check out branch → claim (CLAUDE.md §4.1) → inspect code → tests first → implement scope → run suite → update docs → commit → PR when done.

### `RESUME`
Current branch → feature folder → read PROGRESS.md + SESSION_STATE.md → `git log <parent>..HEAD` and `git status` (warn on mismatch) → run the feature's tests → continue from **Exact next action**.

### `END SESSION` (also before stopping for any reason)
Update feature SESSION_STATE.md and PROGRESS.md; commit `docs(<slug>): update session state`; push.
