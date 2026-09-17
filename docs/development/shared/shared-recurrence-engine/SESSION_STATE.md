# Session State — F0-09 Recurrence engine (pure TypeScript)

Last session date: 2026-09-17
Current branch: `feature/shared-recurrence-engine` (created from `main` at `e5818c5`, pushed to origin)
Worked on: full implementation of the recurrence engine per PRD Scope, then a coordinator-reported
  live-testing bug fix (minute-precision override matching, FD-03).
What changed: added `src/lib/recurrence/{types,schema,local-time,expand,index}.ts` and
  `src/lib/recurrence/{expand,schema}.test.ts`; added `zod` dependency; added then removed
  `date-fns`/`@date-fns/tz` after benchmarking (see DECISIONS.md FD-01). Follow-up: fixed
  `expand.ts` so `overridesByOriginalStart` keys are canonicalized to second precision
  (`formatLocalDateTime(parseLocalDateTime(override.originalStart))`), plus 2 new regression
  tests in `expand.test.ts` (see DECISIONS.md FD-03).
Tests run: `npx vitest run src/lib/recurrence`, then full `npm run test` and `npm run verify`
  — repeated after the FD-03 fix.
Test results: 12/12 recurrence tests passing (was 10/10, +2 FD-03 regression tests); 48/48
  full suite passing; `npm run verify` (lint, typecheck, format:check, test) all green.
Current blocker: none.
Important discoveries:
  - `@date-fns/tz`'s `TZDate` is too slow for AC-08's 500-rule/6-week/<100ms budget
    (~93-111ms measured) because each operation resolves the IANA timezone. Switched to
    a plain-`Date`-with-UTC-slot wall-clock representation (~5ms for the same case).
  - date-fns's own `addMonths`/`addYears` already clamp to the target month's last day,
    but only when computed cumulatively from the previous occurrence they *drift*
    (Jan31->Feb28->Mar28->...). Computing every candidate as `anchor + n*interval` avoids
    this — confirmed by direct benchmarking before writing the in-house version.
Important decisions:
  - FD-01 (DECISIONS.md): in-house wall-clock arithmetic instead of TZDate for performance.
  - FD-02 (DECISIONS.md): `frequency`+`interval` already covers PD-046's full option list
    (Fortnightly/Every 2 months/Quarterly/Every 6 months map onto interval multiples); no
    type change needed.
  - FD-03 (DECISIONS.md): bug fix — overrides given at minute precision (valid per
    `localDateTimeSchema`) were silently ignored because the lookup map key didn't match
    `formatLocalDateTime`'s always-with-seconds output. Fixed by canonicalizing the map key.
  - OQ-01, OQ-12 confirmed ANSWERED in root DECISIONS.md (PD-030, PD-046) before starting.
  - OQ-32 (non-blocking): used proposed default, Australia/Melbourne for all date logic.
Exact next action: none — feature is READY FOR PR. Await human review/approval before
  opening the PR (per repo policy; this session did not open one).
Files likely to be touched next: none for F0-09. Consumers: F0-11 (event schema, will need
  real local->UTC conversion for `timestamptz` storage — re-add date-fns/@date-fns/tz there
  under its own DECISIONS.md entry if needed) and FAM-06 (event form, maps UI recurrence
  options onto `RecurrenceRule`).
Warning for next session:
  - Do not re-introduce `@date-fns/tz` `TZDate` into the hot candidate-stepping loop
    (`stepDate` in `expand.ts`) without re-benchmarking against AC-08 — it was removed
    specifically because it missed the 100ms budget.
  - Any future code path that builds an override/candidate lookup key from a `LocalDateTime`
    string must go through `formatLocalDateTime(parseLocalDateTime(...))` first, never
    compare raw strings directly — `localDateTimeSchema` accepts both minute and second
    precision, so raw strings of differing precision that represent the same moment will
    not be equal (this was FD-03's root cause).
