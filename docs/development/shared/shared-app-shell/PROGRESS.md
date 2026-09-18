# Progress — F0-15 Role app shell: rail, header and layouts

Status: IN PROGRESS
Owner: MrThief123
Lane: S — Shared kit
Sprint: SPRINT · planned D3
Branch: `feature/shared-app-shell`
PR target: `main (per OQ-01 — shared work)`
Last updated: 2026-09-18

## Blockers
- None — OQ-01 answered (PD-030)

## Dependencies status
- F0-14 — MERGED TO DEV
- UI-00 — MERGED TO DEV

## Completed
- Feature documentation drafted (Claude Chat planning pack)
- Rail (88px, `bg-rail-gradient`) with role label (FAMILY/CARER/ADMIN) and icon+label nav items; active item is a `bg-surface`/`text-brand` tile, derived from the route via `usePathname` in the small `RailNav` client component (PRD Technical Considerations).
- Family/Carer/Admin rail contents exactly as scoped, in `src/components/shared/nav-config.ts`.
- Header (76px): Family → client avatar (lg/46) + first name (Title/Page) + computed subline; Carer/Admin → active screen name via `ScreenTitle`. Right side: current date (`formatLongDate(new Date())`), divider, bell (Carer only), user avatar (md/32) + first name.
- Role layouts: `(family)/family/[clientId]/layout.tsx`, `(carer)/carer/layout.tsx`, `(admin)/admin/layout.tsx`, each composing Rail + PageHeader and fetching `getCurrentUser()` / `getClientHeaderSummary()`.
- 14 placeholder `page.tsx` routes (one per rail nav item) so rail links actually navigate instead of 404ing; real content is each dashboard feature's job (Out of Scope).
- New `src/server/clients/queries.ts` and `src/server/auth/queries.ts` contracts (FD-01), since none existed yet.

## In progress
- None

## Remaining (deferred, not blocking any AC)
- Top-bar sign-out control — PRD marks this PROPOSED/not drawn; no click behaviour implemented (avatar renders, no menu).
- Carer notification bell has no click behaviour — panel behaviour is CAR-02's scope.

## Acceptance criteria status
- 6 / 6 MET (see ACCEPTANCE_CRITERIA.md; AC-01 and AC-06 have notes — FD-02, FD-03)

## Tests
- Written: 8 (T-01..T-06 plus 2 axe checks) + 2 new integration tests for the `clients` contract
- Passing: all (`npx vitest run` — 107/107 repo-wide; `npx playwright test tests/e2e/shared-app-shell.spec.ts` — 1/1, run against `next dev`)
- Failing: 0

## Files changed
- `src/components/shared/{nav-config.ts,rail.tsx,rail-nav.tsx,rail.test.tsx,page-header.tsx,page-header.test.tsx,screen-title.tsx}`
- `src/components/ui/icon.tsx` (added the 24px size the rail design needs)
- `src/server/clients/queries.ts`, `src/mocks/queries/clients.ts`, `src/server/auth/queries.ts`
- `src/app/(family)/family/[clientId]/{layout.tsx,home,info,calendar,budget,settings}/page.tsx`
- `src/app/(carer)/carer/{layout.tsx,home,patients,calendar,settings}/page.tsx`
- `src/app/(admin)/admin/{layout.tsx,home,manage,staff,clients,settings}/page.tsx`
- `tests/integration/shared-app-shell-clients-contract.test.ts`, `tests/e2e/shared-app-shell.spec.ts`

## Decisions
- See DECISIONS.md — FD-01 (new clients/auth contracts), FD-02 (AC-01 figures vs. fixtures), FD-03 (`next build` fails for any mock-backed route — **needs human decision**, affects every future dashboard feature's e2e).

## Problems encountered
- `npm run pretest:e2e` (`next build`) fails on any route under these layouts: `src/mocks/current-user.ts`'s production guard throws during static prerender. Not fixed (out of F0-15's scope — see DECISIONS.md FD-03). Verified T-06 against `next dev` instead.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Human review of FD-03 (next build / e2e gap) and FD-02 (Margaret's fixture figures) — see DECISIONS.md. Then push and open PR to `main` once approved (CLAUDE.md §8 — never open the PR without prior human approval).

## Ready for PR
- Yes, pending human review of FD-02/FD-03 and PR approval.
