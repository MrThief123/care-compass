# INT-06 Accessibility verification report

Date: 2026-10-03. App baseline: `8c9d644` (main). Audit branch: `feature/shared-accessibility-verification`.

## Result

**Accessibility release check failed.** All 40 dashboard route/view combinations loaded and were audited. 24 had serious `color-contrast` violations, covering 305 element instances. These are repeated instances of four defect groups, not 305 independent bugs. No critical violations were reported. AC-01 remains NOT MET.

**Keyboard checks passed:** Helen reached Physiotherapy in the Family Calendar using Tab, marked it done with Space, and the completion persisted after reload; she then undid it through the same keyboard path. Focus was visible at each traversed step. Carer and Admin directory journeys reached Margaret's page using Tab/Enter with visible focus. AC-02 is MET.

The three role-level axe tests intentionally fail; the dedicated keyboard test passes. No rules, elements or tests were excluded to obtain a green result. Production code was not changed: fixes are outside INT-06's PRD scope.

## Method and reproduction

- Chromium, Playwright 1.56.1, @axe-core/playwright 4.13.0, 1440 × 1000 viewport.
- Local Supabase F0-16 synthetic seed and document placeholders. Helen and Aisha use seeded accounts. A temporary active shift enables Carer edit routes; a disposable admin completes TOTP enrollment. Both temporary resources are removed after the role run.
- Scan WCAG 2.0/2.1 A/AA tags after navigation settles and fonts load. Fail on serious/critical violations. Assert HTTP 200, expected pathname, populated main content and no known error state before scanning.
- Calendar fixtures use 30 November 2026; default month behavior remains the application's behavior. The live clock was 3 October 2026 in Australia/Melbourne. Home and task-log screens consequently do not represent a later live-care date.
- Client-root routes redirect to Home; their Home destination is covered. All rendered Family, Carer and Admin page templates are represented, including client views, day/week/month calendars, new/edit events, task detail and budget edit. Auth pages and dev previews are outside this dashboard matrix.

With the local stack initialized, `.env.local` must contain only local Supabase settings. Do not run against hosted data. From PowerShell:

```powershell
npm ci
npm run build
$env:E2E_DATA_SOURCE = 'supabase'
$env:E2E_PORT = '3266'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = 'test-results/int06-results.json'
npx playwright test tests/e2e/a11y.spec.ts --workers=1 '--reporter=list,json'
```

Expected current result: **3 failed, 1 passed**. Detailed per-route JSON is written to Playwright's test output directories and attached to the test report. Committed evidence: [AUDIT_EVIDENCE.json](development/shared/shared-accessibility-verification/AUDIT_EVIDENCE.json).

## Follow-up bug features

These report-local IDs define separate proposed bug features for human triage; they do not allocate controlled development-plan IDs or claim another lane. All findings are serious, WCAG 1.4.3, expected normal-text contrast at least 4.5:1. Shared-kit changes must be owned by lane S, with affected dashboard lanes verifying integration.

| ID | Affected dashboards | Reproduction and evidence | Proposed ownership and acceptance |
|---|---|---|---|
| INT06-BUG-01 | Family, Carer, Admin client calendars | Open month view. Adjacent-month dates and event rows are too faint: measured examples include 2.43:1 for times, 4.19:1 for titles, and about 2.1:1 for muted dates. `month-grid.tsx` applies opacity to out-of-month content. | Lane S calendar kit; F/C/A regression. Preserve all readable content and date distinctions; all three month-view scans must have no serious/critical contrast findings. |
| INT06-BUG-02 | Family/Carer/Admin Add and Edit event; Admin Manage | Open these pages and inspect the displayed date picker. Selectable out-of-month dates measure 2.11:1 (`#8db8c8` on `#fefefe`). | Lane S date-picker kit; F/C/A regression. Adjacent-month dates remain selectable and meet 4.5:1 while retaining the visual month distinction. |
| INT06-BUG-03 | Every Admin route; Carer Patients | Initials in brand-pale avatars measure 4.42:1 (`#07727d` on `#c6eaef`) at 12–14 px. Examples: disposable admin header, staff avatars in Manage, patient avatars. | Lane S avatar/tokens; A/C regression. Meet normal-text contrast for every avatar size without removing visible initials or accessible names. |
| INT06-BUG-04 | Carer and Admin client day calendars | Open day view for 30 November. Event-card time labels on brand-pale backgrounds measure 4.06:1 (`#696e6a` on `#c6eaef`). | Lane S timeline/event card; C/A regression. Time labels on selected/colored event cards must meet 4.5:1. Recheck Family day view too. |

Use the committed evidence's selectors, HTML and failure summaries to reproduce each occurrence. No changes to tokens, components or dashboard folders were made by this feature.

## Limits and manual review

Axe is an automated check, not a WCAG conformance certificate. It returned incomplete `color-contrast` checks and, on budget-edit pages, `duplicate-id-aria` checks; these are preserved in the evidence and need manual review. Keyboard checks cover the specified completion and directory journeys, not every modal, validation error or menu. Screen-reader behavior, zoom/reflow, focus-indicator contrast and the project's 44 × 44 target rule are not comprehensively verified here. Some Home screens have no H1, and the Patients directory has no heading; recorded for review rather than silently bypassing the whole page scan.

The final run used real local guards and persistence. Earlier local MFA enrollment failed because old containers had TOTP disabled; reloading the unchanged repository config resolved it. Earlier readiness assertions and a noncanonical task-detail fixture key were corrected as test defects (feature DECISIONS.md FD-03). **HUMAN REVIEW: test expectation changed.**

## Regression checks

- `npm run build`: PASS.
- `supabase test db`: PASS — 33 files, 920 tests.
- Seeded Playwright audit: 3 failed (contrast), 1 passed; all 40 combinations scanned, directory keyboard steps passed.
- `npm run verify`: lint passed with three existing warnings; typecheck passed; format check failed on 711 files in the Windows checkout. No unrelated formatting was changed.
- `DATA_SOURCE=mock npx vitest run src --maxWorkers=4 --pool=threads`: PASS — 221 files, 2,611 tests. Early all-suite runs were interrupted while diagnosing wrong fixture mode, disabled local MFA and slow/stalled worker pools; they are not counted as passing. A diagnostic command named a nonexistent checkbox.test.tsx and reported no tests; it is not validation evidence.

## Route coverage

Counts below are serious/critical element instances. Zero means the automated check found none in this rendered state, not that all accessibility requirements are proven.

| Route / view | Serious/critical nodes |
|---|---|
| `/admin/clients` | 1 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/budget` | 1 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/budget/edit` | 1 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/calendar?date=2026-11-30&view=day` | 2 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/calendar?date=2026-11-30&view=month` | 80 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/calendar?date=2026-11-30&view=week` | 1 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/events/e0000000-0000-4000-8000-000000000003/edit` | 7 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/events/new` | 4 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/home` | 1 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/info` | 1 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/tasks` | 1 |
| `/admin/clients/c0000000-0000-4000-8000-000000000001/tasks/e0000000-0000-4000-8000-000000000003%3A2026-11-30T11%3A30%3A00%2B11%3A00` | 1 |
| `/admin/home` | 1 |
| `/admin/manage` | 16 |
| `/admin/settings` | 1 |
| `/admin/staff` | 1 |
| `/carer/home` | 0 |
| `/carer/patients` | 8 |
| `/carer/patients/c0000000-0000-4000-8000-000000000001/calendar?date=2026-11-30&view=day` | 1 |
| `/carer/patients/c0000000-0000-4000-8000-000000000001/calendar?date=2026-11-30&view=month` | 79 |
| `/carer/patients/c0000000-0000-4000-8000-000000000001/calendar?date=2026-11-30&view=week` | 0 |
| `/carer/patients/c0000000-0000-4000-8000-000000000001/events/e0000000-0000-4000-8000-000000000003/edit` | 6 |
| `/carer/patients/c0000000-0000-4000-8000-000000000001/events/new` | 3 |
| `/carer/patients/c0000000-0000-4000-8000-000000000001/home` | 0 |
| `/carer/patients/c0000000-0000-4000-8000-000000000001/info` | 0 |
| `/carer/patients/c0000000-0000-4000-8000-000000000001/tasks` | 0 |
| `/carer/patients/c0000000-0000-4000-8000-000000000001/tasks/e0000000-0000-4000-8000-000000000003%3A2026-11-30T11%3A30%3A00%2B11%3A00` | 0 |
| `/carer/settings` | 0 |
| `/family/c0000000-0000-4000-8000-000000000001/budget` | 0 |
| `/family/c0000000-0000-4000-8000-000000000001/budget/edit` | 0 |
| `/family/c0000000-0000-4000-8000-000000000001/calendar?date=2026-11-30&view=day` | 0 |
| `/family/c0000000-0000-4000-8000-000000000001/calendar?date=2026-11-30&view=month` | 79 |
| `/family/c0000000-0000-4000-8000-000000000001/calendar?date=2026-11-30&view=week` | 0 |
| `/family/c0000000-0000-4000-8000-000000000001/events/e0000000-0000-4000-8000-000000000003/edit` | 6 |
| `/family/c0000000-0000-4000-8000-000000000001/events/new` | 3 |
| `/family/c0000000-0000-4000-8000-000000000001/home` | 0 |
| `/family/c0000000-0000-4000-8000-000000000001/info` | 0 |
| `/family/c0000000-0000-4000-8000-000000000001/settings` | 0 |
| `/family/c0000000-0000-4000-8000-000000000001/tasks` | 0 |
| `/family/c0000000-0000-4000-8000-000000000001/tasks/e0000000-0000-4000-8000-000000000003%3A2026-11-30T11%3A30%3A00%2B11%3A00` | 0 |

