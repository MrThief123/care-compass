# Session State — F0-22 Client header wiring and family route guard

Last session date: 2026-10-01
Current branch: feature/shared-client-header-wiring
Exact next action: none — merged to `main` in #181, 2026-10-01.
Old note: implement (tests are written and failing). Run them with `npx vitest run src/server/clients/header-summary.test.ts "src/app/(family)/family/[clientId]"`; the integration test needs the local Supabase env (see `tests/integration/care-events.test.ts` header). This worktree's node_modules is a symlink to ../care-compass/node_modules (not committed).
Files touched: docs; tests `src/server/clients/header-summary.test.ts`, `src/app/(family)/family/[clientId]/layout{,.mock}.test.tsx`, `tests/integration/shared-client-header-wiring.test.ts`.
Warning: edits `src/app/(family)` (family lane) and `src/server/clients` on the human's instruction (CHG-042).

Visual check (2026-10-01, Playwright, `DATA_SOURCE=supabase` on the local stack, dev server `next dev --webpack -p 3001`: Turbopack rejects the symlinked node_modules, and port 3000 is the fam09 worktree's server):
- Helen on Margaret `/home` and `/settings`: header "Margaret · 78 years · Preston VIC · Banksia Home Care".
- Helen on Robert's URL: redirected to Margaret's `/home`.
- Aisha (carer) on the family URL: `/carer/home`, no error page.
- Family user with no client: `/no-client-linked`.
- `DATA_SOURCE=mock`, `/family/client-margaret/home`: renders as before.
- Admin not checked in the browser (needs the TOTP step, OQ-08); the role check is unit-tested.
