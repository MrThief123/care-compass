# Draft PR: INT-06 Accessibility verification across dashboards

## Summary

Adds seeded axe scans for 40 dashboard route/view combinations and keyboard checks for Family task completion and Carer/Admin client navigation. Delivers the accessibility report and reproducible findings. The human accepted the current appearance and requested proceeding as-is (FD-04); visual fixes are deferred.

This is a draft audit handoff with known failures, not a claim of WCAG compliance or standard Definition of Done completion.

## Feature

- ID / docs: INT-06 — docs/development/shared/shared-accessibility-verification/
- Jira: not recorded
- Target: main
- Latest main merged: 8c9d644
- Tables/contracts changed: none

## Requirements and stories

- REQ-N1, REQ-N2; US-01 accessibility assurance for older family members and other users.

## Acceptance criteria

| AC | Status | Evidence |
|---|---|---|
| AC-01 | NOT MET; known findings accepted for audit handoff | Serious contrast violations on 24/40 combinations; 305 repeated element instances; no critical findings |
| AC-02 | MET | Helen completes and undoes a task with keyboard-only focus and reload persistence |

## Tests

- Added four Playwright tests, written/executed before report implementation; test commit c472852.
- Build: PASS.
- Seeded audit: 3 failed (contrast), 1 passed; all 40 combinations loaded. Carer/Admin directory keyboard steps passed.
- Unit/component suite: 221 files, 2,611 tests PASS.
- Database suite: 33 files, 920 tests PASS.
- Full verify: lint/typecheck PASS; formatting FAIL on 711 checkout files. Its test stage did not run; the unit/component suite was run separately.
- Status page: Chromium at 390 px, no console errors or horizontal overflow.
- Results are from the documented 2026-10-03 audit; the subsequent human-disposition update only changes documentation.

## Test changes after implementation began

**HUMAN REVIEW: test expectation changed.** Invalid heading-readiness assumptions and a noncanonical occurrence key were corrected (FD-03). No axe rules, severity assertions or tests were removed or skipped.

## Decisions

- FD-01: existing OQ-01 answer/main branching.
- FD-02: PRD-required axe adapter and local synthetic seed; human-approved local initialization.
- FD-03: test fixture/readiness corrections and restored local TOTP settings.
- FD-04: human accepts appearance; hand off audit as-is, retain findings, defer fixes. AC-01 and full-verify failures remain disclosed.

## Known findings

Four groups: month-calendar contrast, date-picker contrast, avatar initials contrast and day-calendar time-label contrast. See docs/ACCESSIBILITY_REPORT.md and the committed AUDIT_EVIDENCE.json. Manual-review limitations and incomplete axe checks are documented there. No production UI changes.

## Review disposition

Human approval to open this draft is pending. Do not mark the unchanged acceptance criteria or full verification green based on visual acceptance. No release/compliance sign-off is claimed.
