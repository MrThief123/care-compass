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
