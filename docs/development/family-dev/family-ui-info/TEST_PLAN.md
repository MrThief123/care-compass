# Test Plan — FAM-UI-04 Family Info screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Info renders, then Description, Habits, Medical history and Documentation cards appear in that order with the design text. | ☑ | PASS |
| T-02 | AC-02 | component | Given Habits, when Edit is clicked, then a textarea with the current text and Save/Cancel appears. | ☑ | PASS |
| T-03 | AC-03 | component | Given Documentation, when rendered, then tiles 'Care plan.pdf', 'Medication schedule.pdf' and 'Add file' are shown. | ☑ | PASS |

### Tests added beyond T-01..T-03 (PRD scope, edge cases, contracts)
All titles start `[FAM-UI-04]`, were written first, and pass.

| Test group | Covers | Level | File |
|---|---|---|---|
| Inline edit: focus into the textarea, Save shows the edit and returns focus to Edit, Cancel restores the original, cards edit independently, Edit is not offered twice, blank Save shows "Nothing added yet.", Save trims, an edit is local state only, Tab order textarea → Save → Cancel | PRD Scope (PROPOSED interaction) | component | `src/features/family-info/family-info.test.tsx` |
| 'Add file' says adding files is not available yet and adds nothing | PRD Scope (uploads are FAM-08) | component | `src/features/family-info/family-info.test.tsx` |
| States: documents with no sections, no documents (only 'Add file'), empty state (no Edit, no Add file), error state with Retry, feature-tagged log with no error message, labelled loading skeleton | PRD Scope, States sheet | component | `src/features/family-info/family-info.test.tsx` |
| Long unbroken and non-ASCII text wraps, a long file name is cut to two lines with the whole name in `title`, tiles wrap to another row | PRD Error / Edge Cases, no overlap at any width | component | `src/features/family-info/family-info.test.tsx` |
| axe: the screen while editing, and the loading, empty and error states | PRD accessibility | component | `src/features/family-info/family-info.test.tsx` |
| `loadFamilyInfoData` and `clientMetaLine`: reads only through the contract, only the route's client, no last name or date of birth reaches the screen, missing suburb or organisation leaves no stray separator | PRD Data / privacy | unit | `src/features/family-info/info-data.test.ts` |
| `getClientInfoSections`, `getClientDocuments`: design text word for word, order, client scoping, event documents excluded, unknown and object-prototype ids give `[]`, callers cannot mutate fixtures, supabase mode throws the not-implemented error | CHG-018 contracts | unit | `src/server/clients/queries.test.ts`, `src/server/documents/queries.test.ts`, `src/mocks/queries/clients.test.ts` |
| `DocumentTile` with a name-only document draws the name only, and still draws type and size when it has both | FD-02 (shared tile widened) | component | `src/features/family-task-detail/document-tile.test.tsx` |

No existing test was changed (CLAUDE.md §5). The only removed test-file line is an import statement, merged into a wider import in `src/server/documents/queries.test.ts`.

## Results (2026-09-25, run locally; CI is down, GitHub Actions limits)
- `npx vitest run src tests/unit`: 104 files, 1234 tests, all pass
- `npx tsc --noEmit`: clean
- `npx eslint .`: 0 errors, 3 warnings, none in files this branch touches (`scripts/plan-status.mjs`, `src/app/page.tsx`)
- `npx prettier --check .`: clean
- Playwright e2e on the production build (`next build` + `next start`, excluding the F0-07 auth specs): 35 pass, 1 fail. The failing spec is `shared-app-shell` "keeps header text inside the header bar, without overlap" at 480px or 338px. It is flaky on `origin/family-dev` without this branch: 3 of 4 baseline runs failed, at 480px or at both 480px and 338px, and one passed. On this branch it failed at 338px in one run and at 480px in another. The 768px case passed in every run. The spec measures the shell on `/family/client-margaret/home`, which this branch does not change, at widths below the app's 768px minimum.
- `tests/e2e/auth.spec.ts` (F0-07): not usable here. It needs a local Supabase stack, and `.env.local` is the hosted project, where both specs fail at sign-in. See PROGRESS.md "Problems encountered".
- `supabase test db`: not run. This branch has no migration and touches no schema (`docs/AGENT_REFERENCE.md`: "if schema touched").
- Real-browser check (Playwright, Chromium): the four cards match `family-04-info.png` at device-pixel level at 1440; width sweep 1920, 1600, 1440, 1280, 1024, 768 with stress content shows no overlap and no horizontal overflow; edit, empty and loading states seen; no console errors.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
