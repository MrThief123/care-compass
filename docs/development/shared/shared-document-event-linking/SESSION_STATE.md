# Session State — F0-23 Link uploaded documents to a new event

Last session date: 2026-10-02
Current branch: feature/shared-document-event-linking (worktree `../care-compass-doclink`)
Exact next action: `supabase migration new document_event_linking`, write the function, run `supabase test db supabase/tests/document_event_linking.test.sql`; then `linkDocumentsToEvent`, then the Add event form (`EventDocuments` gets an `onUploaded` prop, the screen keeps pending ids). Integration test needs the local env from `npx supabase status -o env`. Create the migration with `supabase migration new document_event_linking`.
Files touched: docs; `supabase/tests/document_event_linking.test.sql`. node_modules and .env.local in this worktree are local copies/symlinks (gitignored) (CHG-045, plan row and card, F0-23 docs, FAM-08 FD-01 note).
Warning: edits `src/features/family-event-form` (family lane) on the human's instruction (CHG-045). No PR until the human says yes.
