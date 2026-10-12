# Progress — F0-26 Custom sections on Client Details (Family, Carer and Admin)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: S — Shared
Sprint: SPRINT
Branch: `feature/shared-client-custom-sections`
PR target: `main`
Last updated: 2026-10-12

## Blockers
- None. Scope confirmed by the human in-session 2026-10-12 (CHG-061). FD-03 limits confirmed 2026-10-12.

## Completed
- Claimed; CHG-061; DEVELOPMENT_PLAN row and card; PRD REQ-11 note; docs pack
- Tests first (T-01 to T-13), confirmed failing for the right reason

## Acceptance criteria status
- 0 / 16 MET

## Tests
- 2026-10-12, `DATA_SOURCE=mock npx vitest run` on the five new files: 33 failed, 3 passed (36). Failures: the modules `custom-section-input`, `custom-sections`, `custom-section-actions` and `client-custom-sections/custom-sections` don't exist yet, and the three pages don't draw custom sections. The 3 passing are guards already true today (built-ins have no Remove; Admin and Carer read nothing for a client they can't open).
- pgTAP `client_custom_sections.test.sql` NOT run: Docker was not running, so no local stack. It must fail (table missing) before the migration, then pass.
- eslint clean on the new test files.

## Files changed
- Tests: the five files listed in TEST_PLAN.md
- Docs: DECISIONS.md (CHG-061), DEVELOPMENT_PLAN.md, PRD.md, this pack

## Next action
- Run the pgTAP spec once the local stack is up (expect it to fail), then implement: migration, domain type, mock fixtures, read, actions, `CustomSections` component, the three pages.
