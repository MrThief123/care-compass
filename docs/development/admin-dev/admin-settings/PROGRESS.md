# Progress — ADM-10 Admin — Settings

Status: IN PROGRESS (implementation done; awaiting human go-ahead for PR)
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D10
Branch: `feature/admin-settings`
PR target: `main`
Last updated: 2026-09-30

## Blockers
- None. OQ-35 answered (PD-054).

## Dependencies status
- F0-07 — MERGED
- ADM-UI-05 — MERGED

## Completed
- Claimed. Docs updated (FD-01 to FD-04), AC-04 to AC-06 added
- Tests T-01 to T-09 written first
- Migration `20260930032751_admin_update_organisation.sql`; `settings-schema.ts`, `settings-actions.ts`; supabase branch of `getAdminSettings`; screen wired (Save, Reset), preview notices removed
- Australian phone format check added (AC-08, FD-10), then shared with Family, Carer and Staff forms (CHG-038, FD-11). **HUMAN REVIEW: other lanes' tests changed**
- Edit and Cancel flow added on the human's request (AC-07, FD-09)
- ADM-UI-05 tests updated (FD-06, FD-09). **HUMAN REVIEW: test expectation changed**

## In progress
- None

## Remaining
- Route `/admin/settings`; Organisation info card: Organisation name, ABN, Phone, Address; Reset card reused.

## Acceptance criteria status
- 8 / 8 MET by unit, pgTAP and local integration tests

## Tests
- Written: 9 / 9
- Unit/component: `npx vitest run` 2141 passed; 5 failed, all `F0-07`/`F0-04` auth integration tests run against the hosted project from `.env.local` (not this feature)
- `supabase test db`: 15 files, 459 tests PASS (admin_settings 13/13)
- Integration against local Supabase: `admin-settings` 4/4 pass; 3 `documents` (F0-13) tests fail with a storage upload error after `supabase db reset` (not this feature)
- typecheck, eslint (0 errors), prettier clean
- e2e `--grep-invert "F0-07"` on a clean production build: 41 passed, 2 skipped, 1 failed (`family-calendar` keyboard test, flake under parallel load; 10/10 on its own; earlier run flaked a different family spec). Real-browser check of Edit, Cancel, Save and 768px width done

## Files changed
- `supabase/migrations/20260930032751_admin_update_organisation.sql`, `src/lib/supabase/database.types.ts`
- `src/server/admin/settings-schema.ts`, `settings-actions.ts`, `settings-queries.ts`
- `src/features/admin-settings/settings-screen.tsx`, `settings-screen.test.tsx`, `queries.test.ts`

## Decisions
- See DECISIONS.md

## Problems encountered
- None. (Earlier e2e run hit a stray `next dev` on :3000; rerun clean after it was stopped.)

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Ask the human before opening the PR to main.

## Ready for PR
- No
