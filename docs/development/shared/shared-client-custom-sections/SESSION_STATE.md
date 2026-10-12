# Session State — F0-26 Custom sections on Client Details

Last session date: 2026-10-12
Current branch: `feature/shared-client-custom-sections` (worktree `../care-compass-custom-sections`)
Worked on: CHG-061, docs pack, claim, tests first
Tests run: the five new vitest files (33 fail for the right reason, 3 guards pass); pgTAP not run (Docker off)
Current blocker: none
Warning: `.env.local` points at the HOSTED Supabase project. Run pgTAP and e2e only against the local stack.
Exact next action: start Docker and the local stack, run `supabase test db` (the new spec should fail: no table), then implement.
Design notes for implementation:
- Read in `src/server/clients/custom-sections.ts`, actions in `src/server/clients/custom-section-actions.ts`, rules in `src/server/clients/custom-section-input.ts`: separate from `queries.ts`/`actions.ts` so existing tests that stub those modules need no change (AC-16).
- `loadFamilyInfoData` stays as is (its test compares the whole object); each Info page reads custom sections next to it and passes `customSections` to the view as a new optional prop.
- One shared `CustomSections` component in `src/features/client-custom-sections/`; Family/Admin and Carer views render it between Medical history and Documentation.
- Limit enforced by a BEFORE INSERT trigger raising P0001 with "custom section limit" in the message; reserved titles and length by check constraints; unique index on (client_id, lower(title)); `created_by default auth.uid()`.
- Update/remove that change 0 rows re-read the row: still readable means NOT_ALLOWED (shift ended); gone means NOT_FOUND (update) or already removed (remove = ok).
