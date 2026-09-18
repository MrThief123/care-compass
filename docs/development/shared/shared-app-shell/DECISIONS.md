# Decisions — F0-15 Role app shell: rail, header and layouts

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-14 | Carer notifications scope | no | Types: shift assigned/changed/cancelled, family document added, family event added/changed; bell shows unread count and scrolls to the card. |
| OQ-25 | Help tooltips, FAQ and discussion board | no | Parked (PL-05) pending design and priority. |

## Feature decisions log

### FD-01 — Authored the `clients` and `auth` domain contracts
- Date: 2026-09-18
- Context: the header needs client identity (name, age, suburb, organisation) and the signed-in user, but no `src/server/clients/**` or `src/server/auth/**` contract existed yet (UI-00 only authored `budget`/`events`; ARCHITECTURE.md §3.2 says other domains are authored by "the Lane B feature that needs them first" — F0-15 is lane S, but is the first feature needing these).
- Decision: added `src/server/clients/queries.ts` (`getClientHeaderSummary`) and `src/server/auth/queries.ts` (`getCurrentUser` wrapper), each following the existing mock/Supabase data-source-adapter shape, backed by `src/mocks/queries/clients.ts` and the existing `src/mocks/current-user.ts`.
- Reason: keeps `src/app` from importing `src/mocks` directly (lint-enforced, UI-00 AC-06) without inventing a new pattern.
- Alternatives considered: importing `src/mocks/current-user` straight from the layouts — rejected, fails the lint rule.
- Consequences: `getClientHeaderSummary`/`getCurrentUser` are now the sanctioned contract for any future feature needing basic client identity or the signed-in user; extend rather than duplicate.
- Human confirmation required: no (mechanical, follows an established pattern).

### FD-02 — AC-01's example figures ("78 years · Preston VIC") don't match the Margaret fixture
- Date: 2026-09-18
- Context: ACCEPTANCE_CRITERIA.md AC-01 and the Figma mockup both show "78 years · Preston VIC · Banksia Home Care" for Margaret, but `src/mocks/fixtures.ts` (UI-00) has her dob `1950-12-05` and suburb `Ringwood`, which compute to **75 years · Ringwood** as of the reference date.
- Decision: implemented the subline as genuinely computed (age from dob, live suburb, live organisation name) rather than hardcoding the Figma figures. `T-01` (page-header.test.tsx) tests `PageHeader` in isolation with the AC's literal example text (PageHeader is content-agnostic, so this is a valid true statement about the component). The real end-to-end value for Margaret — "75 years · Ringwood · Banksia Home Care" — is covered separately by `tests/integration/shared-app-shell-clients-contract.test.ts`.
- Reason: PD-007 precedence — committed fixture data outranks a static mockup's illustrative numbers; the actual functional requirement is "age computed from date of birth" (PRD.md F0-15 Functional Requirements), not a fixed string.
- Alternatives considered: editing the fixture dob to make Margaret literally 78 — rejected, out of scope for F0-15 to change UI-00's committed fixture data.
- Consequences: any future FAM-UI-01/e2e test that asserts the live Family Home page shows "78 years" will fail against the real fixture; it should assert "75 years · Ringwood" instead, or the fixture should be revisited.
- Human confirmation required: not blocking, flagging for awareness — no functional ambiguity, just a stale illustrative figure.

### FD-03 — `next build` (production) crashes on any mock-backed layout
- Date: 2026-09-18
- Context: `npm run pretest:e2e` runs `next build`, which statically prerenders these layouts. `src/mocks/current-user.ts`'s `assertNotProduction()` guard unconditionally throws when `NODE_ENV=production` (by design, CLAUDE.md §12) — so build fails on any route under a Phase-1 (mock) layout, e.g. `/admin/clients`.
- Decision: did not modify the guard, `playwright.config.ts`, or `package.json` scripts (owned by other features / security-relevant). Verified T-06 (AC-06) by running `next dev` (development mode) directly and pointing Playwright at it instead of `next build && next start`.
- Reason: the guard is a deliberate safety measure against mock sessions ever reaching a real deployed production; weakening it to make a local production-mode build pass is a bigger change than F0-15's scope, and risks a security regression.
- Consequences: **any** Phase-1 screen with a role layout will hit this same `next build` failure — the e2e pipeline (`pretest:e2e` → `next build`) cannot currently produce a runnable build until either F0-07 replaces the mock session, or someone decides how Phase-1 e2e should run (e.g. against `next dev`, or a distinct env flag the guard also checks).
- Human confirmation required: **yes** — this blocks CI e2e for every future dashboard feature, not just F0-15, and needs a decision on which lane/feature owns the fix.

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
