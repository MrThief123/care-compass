# Session State — CAR-04 Carer — Client info

Last session date: 2026-09-30
Current branch: `feature/carer-client-info` (from `main`; claim commit pending push)
Worked on: docs rewrite and tests first
What changed: docs, 5 new test files, 2 changed tests (CAR-UI-02 AC-09)
Tests run: carer-patients + info-sections (vitest), carer_client_info.test.sql (pgTAP), carer-client-info integration (local Supabase)
Test results: all new tests red for the expected reason (missing action, "not implemented" reads, notFound instead of redirect, RLS lets off-shift carers add documents, blocks on-shift section writes)
Current blocker: none
Important discoveries: today any carer with read access can INSERT documents and storage objects (`can_access_client_documents`); `client_info_sections` writes are family-only; both Supabase reads throw "not implemented"; `.env.local` is the hosted project
Important decisions: FD-01 to FD-06
Exact next action: implement in this order: migration → reads + action → redirect → carer Info components; then run `npm test`, `supabase test db`, integration (local env), e2e (local env)
Files likely to be touched next: `supabase/migrations/<new>_carer_client_info.sql`, `src/server/clients/{actions,queries}.ts`, `src/server/documents/queries.ts`, `src/features/carer-patients/find-patient.ts`, `src/app/(carer)/carer/patients/[clientId]/info/page.tsx`, new carer Info components
Warning for next session: do not edit `src/features/family-info/**` (Lane F); do not change the tests except as DECISIONS says.
