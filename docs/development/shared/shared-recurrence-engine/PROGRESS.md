# Progress — F0-09 Recurrence engine (pure TypeScript)

Status: MERGED TO DEV
Owner: Dhruv Verma
Lane: B — Backend
Sprint: SPRINT · planned D2–D3
Branch: `feature/shared-recurrence-engine`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-18 (PR #10 merged to main)

## Blockers
- None. OQ-01 and OQ-12 are ANSWERED in root DECISIONS.md (PD-030, PD-046).

## Dependencies status
- F0-02 — MERGED TO DEV (per `node scripts/plan-status.mjs`, which lists F0-09 as Ready to start)

## Completed
- `src/lib/recurrence/types.ts` — `RecurrenceRule`, `RecurrenceOverride` (cancelled/modified), `DateRange`, `Occurrence`, `LocalDateTime`/`LocalDate` aliases.
- `src/lib/recurrence/schema.ts` — Zod schemas: `recurrenceRuleSchema`, `recurrenceOverrideSchema` (discriminated union), `dateRangeSchema`.
- `src/lib/recurrence/local-time.ts` — Melbourne wall-clock parse/format helpers (`parseLocalDateTime`, `parseLocalDate`, `formatLocalDateTime`, `isAfterLocalDate`, `daysInMonth`).
- `src/lib/recurrence/expand.ts` — `expandOccurrences(rule, range, overrides?)`: anchor-relative candidate stepping (no drift), month/year-end clamping, cancel/move overrides, `until` cutoff, `[range.start, range.end)` windowing.
- `src/lib/recurrence/index.ts` — barrel export.
- All 8 ACs covered by unit tests, written first and confirmed to fail for the right reason before implementation.

## In progress
- None.

## Remaining
- None in scope. Out of scope (unchanged): DB storage of rules (F0-11), UI for choosing recurrence (FAM-06).

## Acceptance criteria status
- 8 / 8 MET (AC-01 .. AC-08), AC-05/AC-06 re-verified against the FD-03 minute-precision override bug fix

## Tests
- Written: 12 / 12 (8 ACs; AC-07 covered by 3 tests — zero, negative, and end-to-end rejection; AC-05/AC-06 each additionally covered by a minute-precision override regression test, see FD-03)
- Passing: 12
- Failing: 0
- Full repo suite: 48 / 48 passing (`npm run test`)

## Files changed
- `src/lib/recurrence/types.ts` (new)
- `src/lib/recurrence/schema.ts` (new)
- `src/lib/recurrence/local-time.ts` (new)
- `src/lib/recurrence/expand.ts` (new; bug fix — see FD-03 — canonicalizes override `originalStart` to second precision before keying `overridesByOriginalStart`)
- `src/lib/recurrence/index.ts` (new)
- `src/lib/recurrence/expand.test.ts` (new; +2 regression tests for FD-03)
- `src/lib/recurrence/schema.test.ts` (new)
- `package.json`, `package-lock.json` — added `zod` (used). `date-fns` and `@date-fns/tz` were added then removed after benchmarking showed they missed the AC-08 performance budget; see DECISIONS.md FD-01.

## Decisions
- See DECISIONS.md: FD-01 (in-house wall-clock arithmetic instead of `@date-fns/tz` for performance), FD-02 (interval covers PD-046's full frequency list, no type change needed), FD-03 (bug fix — minute-precision `originalStart` silently failed to match overrides; found in live testing). OQ-32 non-blocking default (Australia/Melbourne) applied.

## Problems encountered
- Initial implementation used `@date-fns/tz`'s `TZDate` for candidate stepping; AC-08 (500 rules / 6 weeks / <100ms) measured ~93–111ms (over budget on a cold run) due to per-operation IANA timezone resolution. Replaced with a lightweight wall-clock-only `Date`-based representation (see FD-01); AC-08 now runs in ~5ms.
- Live testing (coordinator) found overrides with a minute-precision `originalStart` (e.g. `"2026-10-19T09:00"`, no seconds — valid per `localDateTimeSchema`) were silently ignored: the lookup map was keyed on the raw override string while candidates were looked up via `formatLocalDateTime`, which always emits seconds, so the two never matched. Fixed by canonicalizing the override key through `parseLocalDateTime` → `formatLocalDateTime` (see FD-03). Added two regression tests, confirmed they failed for this exact reason before the fix.

## Assumptions
- Filtering by `[range.start, range.end)` is based on each occurrence's *original* (un-overridden) candidate position; a `modified` override's new `start` may fall outside the window if the override moves it there. No AC exercises this edge case; documented for FAM-06/F0-11 to be aware of when they route real overrides through this engine.

## Next action
- None — ready for human review and PR approval.

## Ready for PR
- Yes (pending human approval to open the PR, per repo policy — not opened by this session).
