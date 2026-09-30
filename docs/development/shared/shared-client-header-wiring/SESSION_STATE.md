# Session State — F0-20 Client header wiring and family route guard

Last session date: 2026-10-01
Current branch: feature/shared-client-header-wiring
Exact next action: implement (tests are written and failing). Run them with `npx vitest run src/server/clients/header-summary.test.ts "src/app/(family)/family/[clientId]"`; the integration test needs the local Supabase env (see `tests/integration/care-events.test.ts` header). This worktree's node_modules is a symlink to ../care-compass/node_modules (not committed).
Files touched: docs; tests `src/server/clients/header-summary.test.ts`, `src/app/(family)/family/[clientId]/layout{,.mock}.test.tsx`, `tests/integration/shared-client-header-wiring.test.ts`.
Warning: edits `src/app/(family)` (family lane) and `src/server/clients` on the human's instruction (CHG-040).
