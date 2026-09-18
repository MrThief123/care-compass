# Decisions — UI-03 Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-03 | Budget threshold percentages | no | Follow the client's 75/85/100 unless the client approved D4; make thresholds a single configuration constant. |
| OQ-38 | Client information fields | no | Build the design for MVP; remaining fields parked (PL-13, PL-22) pending client confirmation. |
| OQ-39 | Design copy and visual inconsistencies | no | Follow tokens and the rules in UI-§5; generate warning text from real data; confirm copy. |

## Feature decisions log

### FD-01 — Non-blocking OQ defaults applied as-is
- Date: 2026-09-18
- Context: OQ-01 is ANSWERED (root DECISIONS.md PD-030). OQ-03 (budget thresholds) is ANSWERED (PD-032: 75/85/100) and already implemented as `BUDGET_THRESHOLDS`/`deriveBudgetBucketState` in `src/mocks/fixtures.ts` — `BudgetBucketCard` just renders the `BudgetBucketSummary.state` it's given, so no new threshold logic was needed here.
- Decision: used the proposed defaults for OQ-38 (client info fields — built to the design, no extra fields) and OQ-39 (design copy/visual inconsistencies — followed design tokens per UI-§5) without modification.
- Reason: both are non-blocking; CLAUDE.md §2 says use the documented default and note it.
- Human confirmation required: no.

### FD-02 — BudgetBucketCard's "warning" state keeps the neutral ground
- Date: 2026-09-18
- Context: the Figma component doc for the source card says "warning70 keeps the white ground and adds the alert icon; alert90 and depleted100 move to the bg/alert ground". `BudgetBucketState` has four values (`ok`/`warning`/`alert`/`exhausted`), but AC-01 only specifies the `alert` case explicitly.
- Decision: implemented three visual tiers — `ok` (neutral, no icon), `warning` (neutral ground, alert-triangle icon shown), `alert`/`exhausted` (alert ground, alert-strong ink, alert-tone bar, icon).
- Reason: matches the Figma component's documented behaviour precisely; AC-01's literal test only exercises `alert`, so this is filled in from the design doc, not invented.
- Human confirmation required: no — directly sourced from the fetched Figma component description, not a guess.

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
