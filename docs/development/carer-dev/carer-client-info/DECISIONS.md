# Decisions — CAR-04 Carer — Client info

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-09 | Carer access model | YES | ANSWERED (PD-041; read follows shifts, CHG-027; edit only while a shift is in progress). |
| OQ-19 | Figma access and remaining design gaps | no | Claude Code re-checks Figma in F0-01; each gap blocks only the features that cite it. |

## Feature decisions log

### FD-01 — CAR-04 builds the shared Info read/save contract (FAM-09 not merged)
- Date: 2026-09-30
- Context: `getClientInfoSections` and `getClientDocuments` throw for Supabase; no action saves a section; RLS lets only family write `client_info_sections`. FAM-09 would build these but is not merged.
- Decision: CAR-04 builds the Supabase reads, `saveClientInfoSection` and the carer RLS migration. FAM-09 reuses them and adds only family rules.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session).

### FD-02 — Carer wrappers in `src/features/carer-patients/`
- Date: 2026-09-30
- Context: `InfoSectionCard` and `DocumentationCard` (Lane F) keep edits in local state and say uploads are unavailable. CLAUDE.md §4.2 forbids editing another lane's folder.
- Decision: carer components in `src/features/carer-patients/` render the same look and call the contract; `src/features/family-info/` is untouched. Possible convergence with FAM-09 later. Default, flagged for the human.

### FD-03 — No-access URL redirects to Patients (was not-found)
- Date: 2026-09-30
- Decision: `findCarerPatient` redirects to `/carer/patients` instead of `notFound()`, following AC-04. Changes the two [CAR-UI-02][AC-09] tests. HUMAN REVIEW: test expectation changed.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session).

### FD-04 — Info tab only
- Date: 2026-09-30
- Decision: Home, Calendar and Care log stay 'Coming soon' (they need a Lane F base-path/read-only change, CHG-028). Recorded as follow-up, not folded in.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session).

### FD-05 — Documents: carers upload on shift, cannot remove
- Date: 2026-09-30
- Decision: the migration narrows document and storage inserts for carers to an active shift (today any carer with read access can insert); `detach` stays as is for family and is not offered to carers in the UI.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session).

### FD-06 — Docs rewritten; PR target is `main`
- Date: 2026-09-30
- Decision: PRD Scope, ACs (AC-01 to AC-09), TEST_PLAN and USER_STORIES rewritten before code (CHG-026/027/028/032, PD-041). Branch from and PR to `main` (CHG-036), not `carer-dev`. Copy 'Your shift has ended, so changes can't be saved.' and the 5,000-character cap are the PRD's PROPOSED values, used as the defaults.

### FD-07 — Admin of the client's organisation reads and writes Info sections and uploads documents
- Date: 2026-09-30
- Context: the brief and D28 said admin never writes `client_info_sections`; the human then ruled that admin can do everything except move organisations.
- Decision: the migration adds admin insert and update policies (`is_admin_of_client`, `updated_by = auth.uid()`) and adds admin to the select policy. Admin uploads to `documents` and `client-documents` are kept (`can_upload_client_documents` = family, admin of the client, or carer on shift). Another organisation's admin is refused. No UI for admin here.
- Test changes caused: `carer_client_info.test.sql` [CAR-04][AC-03] 'admin cannot insert' and 'admin update changed nothing' now expect success; added admin read, other-organisation admin read and insert (plan 21 to 24). HUMAN REVIEW: test expectation changed.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session).

### FD-08 — Test changes made at implementation (steps 2)
- Date: 2026-09-30
- `src/server/clients/queries.test.ts` [FAM-UI-04][PRD] 'getClientInfoSections throws the not-implemented error': before, asserted the Supabase mode throws "not implemented"; after, removed (replaced by [CAR-04][AC-08] in `info-sections.test.ts`). Reason: CAR-04 implements the read (FD-01). HUMAN REVIEW: assertion removed.
- `src/server/documents/queries.test.ts` [FAM-UI-04][PRD] 'getClientDocuments … not-implemented': same change, same reason.
- `src/server/clients/info-sections.test.ts` fake `createClient`: before, the returned client carried the builder's `then`, so `await createClient()` resolved to the query result and every Supabase-mode test failed with `supabase.from is not a function`; after, `then` is removed from the client and stays on the chained builder. Reason: genuine test bug; no assertion changed.
- `getClientDocuments` returns `url: ""` for Supabase documents: the bucket is private and files open through `getDocumentUrl` (F0-13); `DocumentRef.url` is a required string.

### FD-09 — On-shift carers see all three section cards; local storage index quirk
- Date: 2026-09-30
- Decision: on shift, Description, Habits and Medical history each show a card even when never written ("Nothing added yet." plus Edit), so a carer can add a first entry. Off shift, an unwritten section is left out. The "No information yet" empty state shows only when off shift with nothing at all.
- Local stack note (not in a migration): storage-api v1.77.0 needs a unique index on `storage.objects (bucket_id, name collate "C") where archived_at is null`; the local DB lacks it after `supabase db reset`, so every upload fails 42P10 (F0-13 too). Create it as `supabase_storage_admin` before upload integration or e2e runs.

### FD-10 — Open and download documents on the Info tab (CHG-CAR04-01)
- Date: 2026-09-30
- Context: `getDocumentUrl` (F0-13) returns a signed URL but no screen calls it; Supabase `DocumentRef.url` is "" (FD-08).
- Decision: a carer wrapper around `DocumentTile` (family-task-detail, not edited) makes a client-document tile a button that opens the signed URL in a new tab; on failure an inline status message shows. Mock mode shows the NOT_AVAILABLE message. Read access follows assignment, so it works on and off shift. Tiles added in this session stay non-clickable (brief; the id is known, so this can be relaxed later). Adds AC-10 / T-10.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session; scope addition).
- Test changes caused: none to existing tests; `getDocumentUrl` added to the `documents/actions` mock in `carer-client-info.test.tsx`.

### FD-11 — Raise the upload body limits in `next.config.ts` (shared file, human-approved)
- Date: 2026-09-30
- Context: uploads over 1 MB failed ("Body exceeded 1 MB limit", 413) although `MAX_DOCUMENT_SIZE_BYTES` is 20 MB. Reading `node_modules/next/dist/docs/` (CLAUDE.md §14) showed a second limit: with `proxy.ts` Next buffers request bodies, by default only to 10 MB (`proxyClientMaxBodySize`); a 10–20 MB upload arrived truncated ("Unexpected end of form").
- Decision: `experimental.serverActions.bodySizeLimit: "21mb"` and `experimental.proxyClientMaxBodySize: "21mb"` (20 MB plus multipart overhead). Both are experimental keys in this Next version.
- Consequences: `next.config.ts` is shared; the change also fixes Family uploads. List it in the PR summary. A file over about 21 MB still meets the body limit before the validator; files between 20 MB and 21 MB get the validator's "Files must be 20MB or smaller.".
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session; the `proxyClientMaxBodySize` half found during verification and covered by the same approval's intent, flagged for review).
- Verified: e2e (local stack, production build) uploads 3 MB and opens it via its signed URL; 20.5 MB is refused with the validator's message.

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
