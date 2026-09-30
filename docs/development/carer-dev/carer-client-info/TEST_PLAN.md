# Test Plan — CAR-04 Carer — Client info

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Rewritten 2026-09-30.

## Test levels used
- **component** → `src/features/carer-patients/carer-client-info.test.tsx` (Vitest + Testing Library; the page is rendered with the contract mocked)
- **unit** → `src/server/clients/info-sections.test.ts` (action and queries, Supabase client faked)
- **db** → `supabase/tests/carer_client_info.test.sql` (pgTAP)
- **integration** → `tests/integration/carer-client-info.test.ts` (Vitest against local Supabase)
- **e2e** → `tests/e2e/carer-client-info.spec.ts` (Playwright, local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Off shift: four cards, no Edit link, no Add file tile, 'View only' notice. | ☑ | FAILS (expected) |
| T-02 | AC-02 | e2e | Signed in as an on-shift carer, edit Habits, save, reload: new text shown. | ☑ | FAILS (expected) |
| T-03 | AC-03 | db | Off shift: section insert/update, document insert and storage upload rejected; on shift accepted; admin rejected; read allowed. | ☑ | FAILS (expected) |
| T-04 | AC-04 | component + integration | Unassigned client: layout and Info redirect to `/carer/patients`; real RLS gives the unassigned carer no sections. | ☑ | FAILS (expected) |
| T-05 | AC-05 | component + unit | Save rejected with the shift-ended message: shown, draft kept, saved text unchanged; RLS error maps to that message. | ☑ | FAILS (expected) |
| T-06 | AC-06 | unit + component | Over 5,000 characters refused before the database; error shown. | ☑ | FAILS (expected) |
| T-07 | AC-07 | component + integration | On shift: Add file calls `uploadDocument` with the client and file, tile appears; error shown on failure; no remove control. Real: on-shift carer uploads, off-shift refused. | ☑ | FAILS (expected) |
| T-08 | AC-08 | unit + integration | Supabase reads: section order, missing sections left out, client documents oldest first, no event or detached documents. | ☑ | FAILS (expected) |
| T-09 | AC-09 | component | Contract rejects: error state, logs name no client or carer. | ☑ | FAILS (expected) |
| T-10 | AC-10 | component + e2e | Tile click calls `getDocumentUrl(id)` and opens the URL in a new tab (no opener), on and off shift; failure shows an inline message; just-added tile not clickable. Real: signed URL fetches the file. | ☑ | component PASS; e2e PASS (real signed URL, 3 MB upload) |

## Regression scope
- `npm test`, `npm run typecheck`, `npm run lint`, `supabase test db`, `npm run test:integration`, and the CAR-related Playwright specs before READY FOR PR.

## Test data
- Component/unit tests use their own fixtures. db, integration and e2e create their own users, organisation, client and shifts (F0-16 seed is not merged).
- e2e writes rows to whichever Supabase `.env.local` points at; run it against the local stack only.

## Changed existing tests (HUMAN REVIEW: test expectation changed)
- `carer-patients.test.tsx` [CAR-UI-02][AC-09] ×2 (`notFound`) become `redirect('/carer/patients')`. Reason: FD-03.
- `carer-patients.test.tsx` [CAR-UI-02] Info tests that clicked Edit and expected the "not saved" Phase 1 behaviour, if any, are kept until implementation shows a conflict.
- `src/server/clients/queries.test.ts` [FAM-UI-04][PRD] and `src/server/documents/queries.test.ts` assert that the Supabase mode of `getClientInfoSections` / `getClientDocuments` throws "not implemented". CAR-04 implements both, so at implementation these two assertions are replaced by the [CAR-04][AC-08] tests (recorded requirement change; HUMAN REVIEW: assertion removed).
