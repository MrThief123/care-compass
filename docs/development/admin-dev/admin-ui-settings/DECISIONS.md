# Decisions — ADM-UI-05 Admin Settings screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-35 | Settings forms save behaviour | no | Add a Save button per card; Role read-only for carers; email field is contact email only. |

## Feature decisions log

_No decisions recorded yet._

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

### FD-01 - Local preview and carried-forward authorization
- Human requested Admin Settings with a local preview before any commit or push.
- Human explicitly retained Clients-page permissions for this page while prohibiting commits/pushes.
- Accordingly, added src/server/admin/settings-queries.ts and src/mocks/admin-settings.ts using the existing Admin contract/fixture pattern.
- Local branch feature/admin-ui-settings starts at origin/admin-dev 697c646. Parentage and ready-to-start gate verified.
- No remote claim/commit/push: explicit preview instruction supersedes those workflow steps.
- No shared UI components or Family files changed.

### FD-02 - Settings behavior and validation
- OQ-35 is ANSWERED by PD-054: Organisation info has a Save button.
- Save validates and normalizes local state only; reload restores fixtures. Feedback states this explicitly.
- ABN format follows ADM-10's documented proposed 11-digit format; spaces accepted. No checksum validation is inferred from synthetic design data.
- Organisation name, phone and address must not be blank. No new library; existing Zod used.
- Password-reset action is a local preview interaction with explicit "No email was sent" feedback. No auth/server action invoked; live reset belongs to ADM-10/F0-07.
- Missing organisation returns an empty card; reset card stays available.

### FD-03 - Design and verification
- No Admin Settings reference image exists in docs/design/screens. Composed existing DetailsFormCard and SettingsActionCard using Admin spacing/tokens.
- Tests for screen, query and route states ran first and failed for missing implementation files.
- 12 Settings tests pass, including actual Admin layout without a bell and accessibility scan.
- Relevant Admin/form/list regression suite: 131 tests passed across 21 files.
- TypeScript and scoped ESLint/Prettier pass; HTTP /admin/settings is 200 with all four expected values.
- Browser runtime has no available browser. Pixel comparison remains unverified.

### FD-04 - Human-requested capitalization
- Changed visible labels to Reset Username / Password, Organisation Info and Organisation Name.
- Updated test label selectors accordingly; validation and interaction assertions unchanged.
- No commits or pushes authorized.

### FD-05 - Conditional PR authorization
- Human requested commit/push and opening the PR if no checks fail.
- Supersedes prior no-commit/no-push restriction. Feature branch targets admin-dev, matching other Admin UI work.
- All branch checks must complete without failures before PR creation; distinguish skipped checks.
- PR status documentation is prepared with this authorized commit per workflow section 7.
- Do not merge.
