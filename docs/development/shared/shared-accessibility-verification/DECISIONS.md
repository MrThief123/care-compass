# Decisions — INT-06 Accessibility verification across dashboards

## FD-01 — Scope and prerequisites (2026-10-03)

OQ-01 was answered by Dhruv Verma on 2026-09-17 in root DECISIONS.md. CHG-036 requires a branch from main and PR to main. The generated plan lists INT-06 ready; FAM-15, CAR-09 and ADM-10 are merged. The original feature notes were stale. No open decision was answered by this session.

INT-06 adds verification and a report only. Dashboard defects remain separate work. No production code or controlled requirements are changed.

## FD-02 — Test dependency and local data (2026-10-03)

Added @axe-core/playwright, explicitly required by the PRD. This is the Playwright adapter for the existing axe engine, not a second accessibility engine. Tests use WCAG 2.0/2.1 A/AA tags and fail for serious or critical violations without exclusions. Full findings and incomplete checks are attached for review.

Use the F0-16 local synthetic seed. Hosted URLs are refused. A disposable admin avoids altering Priya's MFA factors; a temporary current shift enables Aisha's edit routes. Test-created admin and shift are cleaned up. Completion/undo leaves append-only audit history by design.

The human explicitly approved initializing the empty local database with repository migrations and seed on 2026-10-03, after being informed that lane B normally owns db reset. Existing migration files were applied unchanged.

## FD-03 — Test readiness correction (2026-10-03)

T-01 initially required a visible H1 before axe could run. The first execution showed Family Home and the reused Carer Home legitimately render H2 section headings; the AC does not require an H1. The readiness check now requires a visible heading of any level, a main landmark, HTTP 200, the expected pathname, and absence of known loading-error text. Axe severity expectations are unchanged.

HUMAN REVIEW: test expectation changed — removed the invalid H1-only readiness assertion. This corrects a test assumption rather than changing the accessibility requirement. Action and navigation timeouts were added so an MFA setup error is reported promptly.

### FD-03 addendum

The Patients directory has no heading element. Requiring any heading prevented axe from inspecting it, so T-01 now requires nonempty main content instead. The missing heading remains a manual-review observation; no axe assertion was removed. The task-detail fixture key was corrected from an equivalent UTC instant to the application's canonical Melbourne-offset representation, as required by build-occurrences.ts. This fixes an invalid fixture link, not app behavior. Network-idle and font readiness waits keep contrast measurements off transient renders. Every route writes evidence even when another route fails. Keyboard checks also cover opening Margaret from the Carer and Admin directories.

Local Auth containers initially had TOTP disabled despite config.toml enabling it; restarting the stack with the current config resolved enrollment. No auth code or config was edited.
