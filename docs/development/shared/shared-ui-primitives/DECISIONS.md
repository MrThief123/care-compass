# Decisions — F0-14 Core UI primitives and state components

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-39 | Design copy and visual inconsistencies | no | Follow tokens and the rules in UI-§5; generate warning text from real data; confirm copy. |

## Feature decisions log

### FD-01 — New dependencies: lucide-react, jest-axe
- Date: 2026-09-18
- Context: PRD Scope names `lucide-react` explicitly for the Icon wrapper (`components.json` already sets `iconLibrary: "lucide"`); AC-05/T-05 require an axe accessibility assertion per primitive, and root PD-014 (test tooling) already specifies Vitest + Testing Library + axe.
- Decision: Add `lucide-react` (runtime) and `jest-axe` + `@types/jest-axe` (dev, axe-core wrapper with a Vitest-compatible `toHaveNoViolations` matcher) as dependencies.
- Reason: No second library for an existing concern — these implement decisions already recorded (PRD scope, PD-014), not new architectural choices.
- Alternatives considered: `vitest-axe` (less maintained fork of jest-axe); raw `axe-core` (more boilerplate per test).
- Consequences: `expect.extend` for `toHaveNoViolations` added to `vitest.setup.ts`.
- Human confirmation required: no (implements existing PRD/PD-014 decisions).
- Test changes caused (if any): none.

### FD-02 — Status pill "Done" text shows the full actor name, not "Aisha R." (per PD-038)
- Date: 2026-09-18
- Context: This feature's own PRD.md Scope, ACCEPTANCE_CRITERIA.md AC-01 and TEST_PLAN.md T-01 were drafted against the older "Aisha Rahman" → "Aisha R." abbreviation shown in the design mockups (06 · States sheet). Root `DECISIONS.md` PD-038 (answering OQ-13, CONFIRMED 2026-09-17 by Dhruv Verma) later decided staff names are displayed in full everywhere, explicitly superseding "Aisha R." / "Daniel K." abbreviations. UI-00 already applied the identical fix to its own `displayName` AC/test (see `docs/development/shared/shared-domain-contracts-fixtures/DECISIONS.md` FD-01) — this follows that precedent for the Status pill.
- Decision: `StatusPill` renders `Done · <full actor name>` (e.g. `Done · Aisha Rahman`), using the actor name as given, not an abbreviated form. Updated ACCEPTANCE_CRITERIA.md AC-01 and TEST_PLAN.md T-01 to match.
- Reason: PD-038 is a human-confirmed decision; CLAUDE.md §5/§9 permit updating a controlled AC/test to record an already-answered decision rather than shipping code that knowingly contradicts it.
- Alternatives considered: implement the stale "Aisha R." abbreviation as literally written in the original AC (rejected — directly contradicts PD-038); leave StatusPill unimplemented pending re-confirmation (rejected — the answer is already on record).
- Consequences: PRD.md Scope's example text ("'Done · Aisha R.'") is now stale prose but not itself a testable AC; no other AC in this feature is affected.
- Human confirmation required: **HUMAN REVIEW: test expectation changed** — AC-01/T-01 assertion changed from an abbreviated to a full-name expected value; flagged in PROGRESS.md and to be flagged again in the PR description.
- Test changes caused: T-01 ([F0-14][AC-01]) — before: `'Done · Aisha R.'`; after: `'Done · Aisha Rahman'`; reason: recorded requirement change (PD-038 postdates and supersedes the original AC text).

### FD-03 — SearchField loading indicator uses a dedicated `loader` icon, not spun `sliders`
- Date: 2026-09-18
- Context: PRD.md Scope fixes the Icon set to a named list (home, info, calendar, dollar, sliders, person, clipboard-check, bell, search, file, plus, check, alert-triangle, chevrons, x) with no spinner/loader icon in it. The original SearchField implementation reused `sliders` (a settings/filter glyph) with `animate-spin` as a stand-in loading indicator. Found during manual visual review (dev-preview) — the spun `sliders` icon reads as a spinning settings icon, which is confusing and was never recorded as an intentional choice.
- Decision: Add `loader` (lucide `Loader2`) to the `Icon` component's icon map and use it (still with `animate-spin`) for SearchField's loading state, in place of `sliders`.
- Reason: The fixed icon list did not anticipate a loading state needing its own glyph; reusing an unrelated icon (settings/filter) for "loading" is a UX/legibility defect, not a deliberate design decision, and no DECISIONS entry recorded it as intentional.
- Alternatives considered: leave `sliders` spinning (rejected — confusing, unrecorded); use a CSS-only spinner with no icon (rejected — inconsistent with how every other stateful primitive in this kit renders via the shared `Icon` component).
- Consequences: `IconName` union gains one more member (`loader`); no other primitive references `sliders` as a loading state.
- Human confirmation required: no (small, additive fix to an unrecorded implementation gap within this feature's own scope; not a new architectural pattern).
- Test changes caused: none removed; added `search-field.test.tsx` — "[F0-14][FD-03] uses the loader icon (not sliders/settings) for the loading indicator" (new test, not a change to an existing assertion).

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
