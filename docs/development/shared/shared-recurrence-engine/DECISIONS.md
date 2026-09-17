# Decisions — F0-09 Recurrence engine (pure TypeScript)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Status |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | ANSWERED (root DECISIONS.md, PD-030): Option B — `feature/shared-<name>` from `main`, PR → `main`, then merged into all three dev branches. |
| OQ-12 | Recurrence options and plan horizon | YES | ANSWERED (root DECISIONS.md, PD-046): Does not repeat, Daily, Weekly, Fortnightly, Monthly, Every 2 months, Quarterly, Every 6 months, Yearly; perpetual unless an end date is set. See FD-02 below for how this maps onto `RecurrenceRule.frequency`/`interval`. |
| OQ-32 | Timezone | no | Non-blocking; root DECISIONS.md still shows this OPEN. Proposed default (Australia/Melbourne for all date logic) applied per CLAUDE.md §2. |
| OQ-11 | Editing recurring events: scope | no | ANSWERED (root DECISIONS.md, PD-045) — relevant to FAM-07's UI (scope selector), not to this pure-function feature. No action needed in F0-09. |

## Feature decisions log

### FD-01 — In-house wall-clock arithmetic instead of `@date-fns/tz` `TZDate` for candidate stepping
- Date: 2026-09-17
- Context: PRD Technical Considerations and ARCHITECTURE.md (line 56, PROPOSED) name `date-fns` + `@date-fns/tz` for "Dates/recurrence", alongside an "in-house rule expander". AC-08 requires expanding 500 weekly rules over a 6-week range in under 100 ms.
- Decision: implemented candidate stepping (`stepDate` in `expand.ts`) using plain `Date` objects whose UTC slot stores Melbourne wall-clock components (year/month/day/hour/minute/second) — never a real UTC instant, no `Intl`/timezone-database lookups. `date-fns` and `@date-fns/tz` were installed and benchmarked first: constructing/stepping through `TZDate` took ~93–111 ms for the AC-08 case (cold run over budget), because each `TZDate` operation resolves the IANA zone. The in-house version does the same 500-rule/6-week expansion in ~5 ms.
- Reason: the engine only ever adds calendar units to and compares Melbourne local wall-clock values — it never converts to or from a real UTC instant (that conversion is explicitly out of scope, owned by F0-11 when persisting to `timestamptz`). Since no genuine timezone conversion happens, a lightweight wall-clock-only representation is both correct and far faster, and matches ARCHITECTURE.md's own "in-house rule expander" language for this specific concern.
- Alternatives considered: (a) keep `TZDate` for stepping — rejected, fails/risks failing AC-08's 100 ms budget, particularly on slower CI machines; (b) micro-optimise `TZDate` usage (e.g. cache `Intl.DateTimeFormat` instances) — rejected as unnecessary complexity when a correct-by-construction wall-clock model is simpler and an order of magnitude faster.
- Consequences: removed `date-fns` and `@date-fns/tz` from `package.json` (not used anywhere in this feature or the codebase yet). `zod` was kept (used for `src/lib/recurrence/schema.ts`, per PRD "Zod schema for rule validation shared with server actions" and PD-015). A future feature that needs genuine local-to-UTC conversion (e.g. F0-11, for `timestamptz` storage) should re-introduce `date-fns`/`@date-fns/tz` (or an equivalent) under its own DECISIONS.md entry at that point.
- Human confirmation required: no (implementation detail within F0-09's Scope; does not change any AC, PRD Scope item, or public `RecurrenceRule`/`Occurrence` type).
- Test changes caused: none.

### FD-02 — `RecurrenceRule.frequency` + `interval` cover PD-046's full recurrence option list
- Date: 2026-09-17
- Context: PD-046 (OQ-12) specifies the event form's recurrence options as: Does not repeat, Daily, Weekly, Fortnightly, Monthly, Every 2 months, Quarterly, Every 6 months, Yearly. The PRD's Scope section types `RecurrenceRule` as `{ frequency: 'none'|'daily'|'weekly'|'monthly'|'yearly'; interval: number; ... }`.
- Decision: no change to the type. `interval` (combined with the base `frequency`) already covers every PD-046 option: Fortnightly = `{frequency: "weekly", interval: 2}`; Every 2 months = `{frequency: "monthly", interval: 2}`; Quarterly = `{frequency: "monthly", interval: 3}`; Every 6 months = `{frequency: "monthly", interval: 6}`. The event-form UI (FAM-06, out of scope here) is responsible for mapping its select options onto this `frequency`/`interval` pair.
- Reason: this is exactly why `interval` was included in the PRD's Scope type; confirmed no further type change was needed to satisfy PD-046.
- Alternatives considered: adding a `fortnightly`/`quarterly`/etc. literal to `Frequency` — rejected, redundant with `interval` and would create a second way to express the same rule.
- Consequences: none for this feature; noted for FAM-06 to reference when it maps its UI options onto `RecurrenceRule`.
- Human confirmation required: no (clarifying note, not a scope or type change).
- Test changes caused: none.

### FD-03 — Bug fix: minute-precision `originalStart` silently failed to match overrides
- Date: 2026-09-17
- Context: found during live testing (reported by coordinator, not by this session's own test suite). A scratch script called `expandOccurrences()` with a fortnightly rule and cancellation/modification overrides whose `originalStart` used minute precision (`"2026-10-19T09:00"`, no seconds) — matching the precision rule anchors typically use. Both overrides were silently ignored; the occurrences rendered as if unmodified, with no error or warning.
- Root cause: `localDateTimeSchema` (`schema.ts`) accepts both `YYYY-MM-DDTHH:mm` and `YYYY-MM-DDTHH:mm:ss`, so a minute-precision `originalStart` passes Zod validation. But the map used to look up overrides during expansion (`overridesByOriginalStart` in `expand.ts`) was keyed on the override's raw `originalStart` string, while candidates were looked up using `formatLocalDateTime(candidate)`, which always emits seconds (`:00`). `"2026-10-19T09:00"` (override key) never equals `"2026-10-19T09:00:00"` (candidate key) as plain strings, so `Map.get` always missed and the override fell through silently — `addCandidate` treated it as an unmodified occurrence. Every override in the original `expand.test.ts` happened to already use explicit `:00` seconds, so this was never caught.
- Decision: canonicalize each override's `originalStart` through `parseLocalDateTime` → `formatLocalDateTime` when building `overridesByOriginalStart`, so both minute- and second-precision inputs resolve to the same second-precision key that candidate lookups use.
- Reason: fixes the mismatch at its source (key construction) rather than requiring every caller to pre-format `originalStart` to second precision, which the schema doesn't require and callers (e.g. FAM-06/F0-11) shouldn't have to know about.
- Alternatives considered: (a) tighten `localDateTimeSchema` to require seconds — rejected, would break the PRD's own `LocalDateTime` shape and reject legitimately valid minute-precision input elsewhere (e.g. rule anchors); (b) normalize at read time inside `addCandidate` instead of when building the map — rejected, less efficient (re-parses per candidate instead of once per override) for no behavioural difference.
- Consequences: `src/lib/recurrence/expand.ts` — `overridesByOriginalStart` now maps `formatLocalDateTime(parseLocalDateTime(override.originalStart))` to the override. Added two regression tests (`[F0-09][AC-05]`/`[F0-09][AC-06]`, minute-precision variants) to `expand.test.ts`, confirmed they failed for this exact reason before the fix, now passing. No change to `types.ts`/`schema.ts`/public API.
- Human confirmation required: no (bug fix restoring already-specified behaviour — AC-05/AC-06 always required overrides to take effect; no AC, PRD Scope item, or type changed).
- Test changes caused: none removed or weakened; two tests added (`expand.test.ts`, both currently passing).

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
