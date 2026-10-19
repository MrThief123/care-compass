# Progress — F0-25 Client Documents page (Family and Carer)

Status: READY FOR PR
Owner: MrThief123
Lane: S — Shared
Sprint: SPRINT
Branch: `feature/shared-client-documents-page`
PR target: `main`
Last updated: 2026-10-08

## Blockers
- None. Scope approved by the human in-session 2026-10-08 (CHG-058).
- For the human: **HUMAN REVIEW: test expectation changed** (rail and patient tabs gain Documents; FD in DECISIONS.md). New dependency `fflate` (FD-02). Flagged additive Lane S edit to `nav-config.ts` (FD-08). No Figma design (FD-05): please check the look.
- The e2e spec `tests/e2e/shared-client-documents.spec.ts` has NOT passed: it was never run against a local stack (see the note in SESSION_STATE.md). Real Supabase queries (`getAllClientDocuments`, the zip route against real storage) are unverified outside unit tests.

## Completed
- Claimed; CHG-058; docs pack; tests first (failing: modules missing); implementation
- `getAllClientDocuments` (mock + Supabase), Documents page (search, sort, open, Download all), Family rail item, Carer patient tab, zip route (fflate, streamed, 300-file limit)

## Acceptance criteria status
- 16 / 16 MET by unit/component tests (e2e not run)

## Tests
- Last run: 2026-10-08, `DATA_SOURCE=mock npx vitest run src` — 241 files, 2744 tests passed; `tsc --noEmit` clean; eslint clean; prettier clean

## Files changed
- New: `src/features/client-documents/*`, `src/app/(family)/family/[clientId]/documents/*`, `src/app/(carer)/carer/patients/[clientId]/documents/*`, `src/app/api/clients/[clientId]/documents/download-all/route.ts`, `src/server/documents/zip-names.ts`, `tests/e2e/shared-client-documents.spec.ts`
- Edited: `src/server/documents/queries.ts`, `src/mocks/queries/documents.ts`, `src/types/domain.ts`, `src/components/shared/nav-config.ts`, `src/features/carer-patients/patient-tabs.tsx`, two existing test files, `package.json`
- Docs: DECISIONS.md (CHG-058), DEVELOPMENT_PLAN.md, this pack

## Next action
- Run the e2e spec against the local stack; real-browser check at 1280 and 390 px; refresh status page; human approves, then open the PR.
