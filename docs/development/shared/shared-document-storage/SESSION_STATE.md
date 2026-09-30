# Session State — F0-13 Client document storage

Last session date: 2026-09-27
Current branch: `feature/shared-document-storage` (from `main`; claimed and pushed)
Worked on: everything — migration, RLS, storage bucket, file-validation module, Server Actions, all tests, docs
What changed: see PROGRESS.md "Files changed"
Tests run: `supabase test db`; `vitest run src/lib/documents/validate-document.test.ts`;
  `vitest run tests/integration/documents.test.ts` against local Supabase; full `vitest run`;
  eslint; tsc; prettier; `npm run build`
Test results: all green — see PROGRESS.md "Tests" for exact counts
Current blocker: none
Important discoveries:
  - `getEventDocuments`/`getClientDocuments` (UI-04/FAM-UI-04's existing contract) are not
    touched by this feature; their Supabase wiring belongs to FAM-08/FAM-09/FAM-15/CAR-04
    (`src/server/data-source.ts`'s own stated convention).
  - PD-051 says "HEIC"; real devices also send `image/heif` for the same files, so both are
    accepted (FD-03).
  - CI's `unit` job runs against a hosted Supabase project with no migrations beyond what's
    pushed there; this feature's integration test is gated on a local URL like F0-11's,
    FAM-12's, FAM-13's and F0-17's already are.
Important decisions: PD-051 (OQ-26); feature FD-01 to FD-05 (DECISIONS.md). FD-01 needs the human.
Exact next action: human reviews FD-01 (should upload be shift-restricted for carers, like
  `can_edit_care_events`, or general client access as built); on approval, push (already
  pushed up to the docs commit) and open the PR to `main`.
Files likely to be touched next: none, unless review asks for changes, or FD-01 is answered
  "shift-restricted", which would change `can_access_client_documents`'s use in the insert
  policy only (select/detach stay general).
Warning for next session: do not touch `src/server/documents/queries.ts` or its tests
  (UI-04/FAM-UI-04's, not this feature's). Do not regenerate `database.types.ts` (FD-04).
  After pulling any new migration run `npx supabase migration up --local`, then
  `supabase test db`. Integration tests need `supabase start` (the full stack, for Storage),
  not only `supabase db start`.

## 2026-09-30 (status sync, by Dhruv Verma)
- Merged to `main` in #131 on 2026-09-27. Status set to MERGED TO DEV (merged to `main`, CHG-036). Owner unchanged. No code changes.
