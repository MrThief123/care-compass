# Decisions — F0-05 Design tokens, typography and base styles

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-39 | Design copy and visual inconsistencies | no | Follow tokens and the rules in UI-§5; generate warning text from real data; confirm copy. |

## Feature decisions log

### FD-01 — shadcn/ui utility dependencies
- Date: 2026-09-17
- Context: PRD scope requires "shadcn/ui initialised with its CSS variables mapped to the tokens above." shadcn/ui components conventionally depend on `clsx` + `tailwind-merge` (the `cn` helper) and `class-variance-authority` (variant classes); none were present in the repo.
- Decision: Add `clsx`, `tailwind-merge`, `class-variance-authority` as dependencies; create `src/lib/utils.ts` (`cn`) and `components.json`. Added a minimal `Button` primitive (`src/components/ui/button.tsx`) only to prove the token mapping and satisfy AC-04/T-04 — the full primitives kit remains F0-14 scope.
- Reason: These are shadcn/ui's own standard utilities (already CONFIRMED stack choice, ADR-02), not a second library for an existing concern.
- Alternatives considered: Hand-rolled className concatenation — rejected, diverges from the shadcn convention F0-14 will build on.
- Consequences: F0-14 extends `Button` and adds further primitives on this same foundation; no new pattern introduced.
- Human confirmation required: no — implements an already-CONFIRMED architecture choice (ADR-02).
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
