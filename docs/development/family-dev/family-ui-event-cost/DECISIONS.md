# Decisions — FAM-UI-08 Family event cost fields (UI)

## Open decisions affecting this feature
| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-39 | Design copy and visual inconsistencies | no | Follow tokens and UI-§5; copy flagged for review |

## Feature decisions log

### FD-01 — Cost and bucket added to `CareEvent`, with one fixture (CHG-020 route)
- Date: 2026-09-25
- Context: AC-06 needs an event that already has a cost and a bucket, and Edit event reads events only through `getEvent`. `CareEvent` (`src/types/domain.ts`) had neither field, and no fixture event had a cost. `src/types/**` and `src/mocks/**` are Lane S's folders (AGENT_REFERENCE.md); CHG-020 says the exact fields for this feature are recorded here when built, by the same route as CHG-019 (contract extension on a dashboard branch).
- Decision: asked the human (stop-and-ask, CLAUDE.md §10), who left the choice to Claude, 2026-09-25 ("continue you choose"). Chose option 1: `CareEvent` gains optional `cost` (`number`, positive) and optional `bucketId` (a `BudgetBucketSummary.id`); `PHYSIO` (Margaret's Physiotherapy) gets `cost: 90` and `bucketId: "bucket-margaret-ndis"`. Both are optional, so every other event and consumer is unchanged. No new contract function: `getEvent` already returns the event whole, and `getBudgetSummary` already carries `remaining`, `pendingTotal` and `pendingCount` (FAM-UI-05).
- Reason: smallest additive change that keeps the screen on the contracts (CLAUDE.md §7) and matches what FAM-06 / FAM-07 will save.
- Alternatives considered: a feature-local type and fixture (would move to the contract in Phase 3 anyway); waiting for a shared PR (blocks the feature for a two-field change).
- Consequences: flag in the PR that `src/types/domain.ts` and `src/mocks/fixtures.ts` are edited from Lane F. FAM-06 / FAM-07 / F0-11 map `cost` and `bucketId` to columns. The amount is dollars as a JS number in Phase 1; `numeric(12,2)` in the database.
- Human confirmation required: yes for the PR review; the in-session delegation is recorded above.
- Test changes caused: none.

### FD-02 — Cost is checked by the screen, after EventForm's own checks
- Date: 2026-09-25
- Context: `EventForm` (shared kit) validates Date only, and its `extraFields` slot has no validation hook. The Cost and Paid from fields must refuse a bad cost (AC-02) without editing the kit.
- Decision: `EventFormScreen.onSubmit` runs `validateEventCost` (`event-cost.ts`, Zod through the kit's `fieldErrors`) and only then goes to `returnHref`. Messages show under the Cost field and the Paid from group. Changing either field clears the messages.
- Reason: no kit change; the same Zod pattern as the rest of the forms (CLAUDE.md §7). The kit's Date check still runs first, so a bad cost is reported once the Date is valid.
- Alternatives considered: adding a validator prop to `EventForm` (a shared PR); validating on every keystroke (noisier than the other fields).
- Consequences: FAM-06 / FAM-07 reuse `validateEventCost` and `parseEventCost` for the saved values.
- Human confirmation required: no.
- Test changes caused: none.

### FD-03 — Paid from is a local radio group, not the kit's `ChipGroup`
- Date: 2026-09-25
- Context: AC-03 needs an option struck through with "No funds left" and each option showing a balance; `ChipGroup` options are a label string and a `disabled` flag only.
- Decision: `EventCostFields` renders native radio inputs (a `radiogroup`, one label per bucket). A closed bucket (balance $0 or below, or any pending cost) is `disabled`, so neither a click nor the arrow keys can choose it, with `line-through` plus the words "No funds left". A saved bucket that has since closed stays checked. Choosing a bucket the cost exceeds shows an `InlineAlert` and keeps the choice.
- Reason: strike-through plus words is not colour alone (REQ-N2); native radios give the keyboard behaviour for free; 44px rows.
- Alternatives considered: extending `ChipGroup` (shared PR, Lane S).
- Consequences: a candidate for the kit if CAR-07 / ADM-11 reuse it (they reuse this form).
- Human confirmation required: no.
- Test changes caused: none.

### FD-04 — Non-blocking defaults used
- OQ-39 (design copy): the fields are not in the design (PD-052 / OQ-19); the labels "Cost", "Paid from", the hint, "No funds left", the pending warning and "A change applies to future completions only." are PROPOSED wording, flagged **HUMAN REVIEW** in the PR.
- A bucket with $0 shows "No funds left" in place of its balance; a bucket with a pending cost shows the same words (PRD Scope), not its balance.
- The cost is accepted with an optional leading `$` and thousands commas ("$1,250.50"); Edit event opens it as "$90.00".
- With a saved cost, the "applies to future completions only" note shows on Edit event whatever the person has typed since.
- Human confirmation required: no.
