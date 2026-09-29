# Decisions — FAM-06 Family — Add event (Enter event)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-22 | Event fields | YES — now ANSWERED (root DECISIONS.md, 2026-09-17) | Add Title, Start time and Duration fields to the event form (design update). |
| OQ-12 | Recurrence options and plan horizon | YES — now ANSWERED (root DECISIONS.md, 2026-09-17) | Options: Does not repeat, Daily, Weekly, Fortnightly, Monthly, Every 2 months, Quarterly, Every 6 months, Yearly; repeats indefinitely unless an end date is set. |
| OQ-10 | Status behaviour and undo | YES — now ANSWERED (root DECISIONS.md, 2026-09-27) | Overdue derived when due time passes without Done (not selectable); Done can be undone by the same actor or family via an append-only 'undone' entry. |
| OQ-19 | Figma access and remaining design gaps | no | Claude Code re-checks Figma in F0-01; each gap blocks only the features that cite it. |

## Feature decisions log

### FD-01 — Title/Start time/Duration built as a local `extraFields` component, Add event only
- Date: 2026-09-27
- Context: OQ-22 says to add Title, Start time and Duration to the event form, but `EventForm` (the shared UI-02 kit component) does not have them, and its own doc comment already earmarks this to FAM-06/FAM-07/CAR-07 via its existing `extraFields` slot (the same mechanism FAM-UI-08 used for Cost). `src/components/shared/**` is Lane S folder-owned (CLAUDE.md §4.2); a dashboard feature must not edit it directly.
- Decision: built `EventDetailsFields` (`event-details.ts`/`event-details-fields.tsx`) as a local component in `src/features/family-event-form/`, passed into `EventForm`'s `extraFields`, exactly like `EventCostFields`. Rendered only when `mode === "add"` — Edit event's persistence is FAM-07 (out of scope), so showing these fields there would be blank and misleading rather than reflecting the real event.
- Reason: keeps the change inside Lane F's owned folders, matches the established pattern (`EventCostFields`) exactly, and avoids a new, empty-looking form section on Edit event before FAM-07 wires it for real.
- Alternatives considered: editing `EventForm` directly to add the fields — rejected, out of Lane F's folder ownership without a shared PR; showing the fields (disabled) on Edit event too — rejected, would misrepresent the event's actual saved title/time until FAM-07 lands.
- Human confirmation required: no.
- Test changes caused: none (new tests only).

### FD-02 — AC-01's "recurs every week" is proven at the integration level, not e2e
- Date: 2026-09-27
- Context: TEST_PLAN.md originally levelled T-01 as e2e. This repo's Playwright e2e always runs `DATA_SOURCE=mock` (no override in `playwright.config.ts`, same fact FAM-04/FAM-05 recorded), and the mock data source's occurrences are static, curated fixture arrays (`src/mocks/fixtures.ts`), not expanded from a recurrence rule at read time — so a created event's *future* weekly occurrences cannot appear in a mock-mode read without duplicating the recurrence engine inside the mock layer, which is `src/lib/**`/`src/mocks/**` shared-owned territory FAM-06 should not take on.
- Decision: `createEvent`'s mock branch (`src/mocks/queries/events.ts`) adds the event and its first (anchor) occurrence only, so the created event is visible immediately (Functional Requirement: "the new occurrence visible"). AC-01's full "recurs every week" claim is proven at the integration level against real Supabase (`tests/integration/family-add-event.test.ts`, which creates a real weekly event and reads four real generated occurrences four weeks apart via `loadOccurrences`/F0-11).
- Reason: matches the FAM-04/FAM-05 precedent for the same structural limitation; the real recurrence expansion (F0-11/`src/lib/recurrence`) is already fully tested, and duplicating it inside the mock layer would be new, unscoped, shared-folder work for a Phase 1/dev-preview convenience.
- Alternatives considered: expand the full series into the mock fixtures using `src/lib/recurrence` — rejected as unscoped shared-folder work; leave the created event entirely invisible in mock mode — rejected, contradicts the PRD's own (PROPOSED) Functional Requirement and would make manual dev-preview/demo confusing.
- Human confirmation required: no.
- Test changes caused: T-01 recorded as component + integration rather than pure e2e in TEST_PLAN.md (TESTING.md §6 level change, not a behaviour change).

### FD-03 — AC-04's "a carer... is rejected" tests a carer with no active shift, not carers categorically
- Date: 2026-09-27
- Context: AC-04 says "Given a carer or unrelated user calls the create-event action for Margaret, ... then it is rejected." The `care_events_insert` RLS policy (F0-11, OQ-09) already allows a carer to write during an active shift for that client, by design — the same authorisation model `set_occurrence_done` uses, and the basis CAR-07 (Carer — Add and edit events, POST-SPRINT, not started) is expected to reuse later. FAM-06 itself has no UI for a carer to reach this action at all (Users: Family only), so "a carer" here means the action's own authorisation, not a UI gap.
- Decision: no additional application-level restriction was added beyond RLS (per ARCHITECTURE.md/CLAUDE.md §7 "authorisation lives in RLS"). AC-04 is proven with a carer assigned to the client but with no active shift, which RLS refuses exactly like an unrelated family user — both integration-tested (`[FAM-06][AC-04]` in `tests/integration/family-add-event.test.ts`).
- Reason: adding a stricter "never a carer" check in `createEvent` would create a second authorisation rule alongside RLS's (CLAUDE.md §7: "one pattern per problem") and would need reverting when CAR-07 is built.
- Alternatives considered: reject every carer unconditionally in `createEvent` regardless of shift — rejected, contradicts OQ-09's already-answered authorisation model and would need undoing for CAR-07.
- Human confirmation required: no — this follows OQ-09's already-confirmed model; flagged here for visibility since it reads AC-04 slightly narrower than its literal wording.
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
