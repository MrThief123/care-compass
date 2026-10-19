# Decisions — INT-07 Scale and performance verification

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-17 | Hosting, email, scheduler, environments and availability | no | Vercel (or equivalent) + Supabase paid tier; Resend (or Supabase SMTP) for email; Vercel Cron or pg_cron for jobs — confirm budget with client. |

## Feature decisions log

See FD-01 onward below. The open-decision table above is historical; both listed decisions are answered in root DECISIONS.md.

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

## FD-01 — Confirmed local budget and dataset (2026-10-03)

The human confirmed p95 below 1 second for Home, Calendar week and Task log, using 500 recurring events per client across 50 synthetic clients. Measure 20 samples per operation using nearest-rank p95 (19th sorted sample). Keep warm-up separate. Local-only assurance, not a production SLA. OQ-01 and OQ-17 were already answered in root DECISIONS.md (PD-030/PD-050).

## FD-02 — Reproducible workload and measurement boundaries

Use a separate INT-07 synthetic organisation and family account on the existing local stack, without resetting or touching the F0-16 seed. Fifty clients each have 125 daily, 125 weekly, 125 monthly and 125 yearly manual recurring events anchored on 4 January 2016. There are no generated persisted occurrences, completions, overrides or charged events in this baseline. Existing application recurrence code performs expansion. The family account is linked only to the first scale client; other clients exercise table size and RLS selectivity.

Twenty sequential samples follow one excluded warm-up. Query timing calls the actual getOccurrences contract through a real family session; only Next's cookie/header request context is supplied by the test harness. Page timings use authenticated, fully received local HTTP responses from the production build and include render plus loopback transfer, not browser hydration. No production-load or concurrency claim is made.

Expensive benchmarks live in tests/performance with explicit configs, outside the normal regression discovery; they are opt-in rather than skipped. This adapts the test-plan integration path to avoid making every unit run seed 25,000 rows and time a production server. CLI seed uses Node's existing TypeScript stripping support and adds no dependency. Evidence lives in test-results/int07 so next build cannot erase it. The output-path move corrects infrastructure only; no acceptance threshold or assertion changed.

## FD-03 — Index decision based on plans

Initial authenticated-family EXPLAIN ANALYZE uses care_events_client_id_starts_at_idx, care_event_overrides_client_id_idx and care_event_completions_client_id_idx. The main events read was about 116 ms and related reads under 2 ms. Do not add a redundant index or change schema without evidence of benefit. Any necessary schema change must be coordinated with lane B per folder ownership; none has been made.

## FD-04 — Correct page-benchmark authentication setup (2026-10-04)

The first three page tests timed out waiting for network idle on Home after UI sign-in. They collected no page samples, so those failures cannot establish separate Home, Calendar and Task log timings. Replace that setup with a real password sign-in through Supabase SSR and install its session cookies in the Playwright context. Each route is then requested independently with the family's RLS permissions. This corrects a harness dependency on Home; it does not change the twenty-sample requirement, response assertions or 1,000 ms threshold. No production code or authentication bypass is introduced.

Main advanced to 817aa9b. Merge 4c9d388 incorporated it; the only conflict was the generated status-page data, resolved by keeping main's page and regenerating its data with INT-07's current state. Rebuilt successfully before rerunning page measurements. Earlier query/regression results remain explicitly labelled with their earlier baseline.

## FD-05 — Stop a provably failed page run without inventing p95 (2026-10-04)

The corrected Home harness returned a valid first timed response in 72,214.7 ms. Completing twenty such responses would exceed the original test timeout. Add an early failure assertion after two timed responses at or above 1,000 ms: even if the remaining eighteen were instantaneous, the nineteenth ordered value would still fail the same p95 budget. Preserve the raw durations, completed/planned sample counts and null p95 until all twenty samples exist. A passing run still requires twenty samples and p95 < 1,000 ms. The Calendar query AC still runs all twenty. This is an added failure check, not a relaxed expectation, skipped test or claimed percentile from an incomplete sample. The initial corrected run was interrupted to apply this bounded diagnostic; its first sample is retained here, not substituted for the rerun.

## FD-06 — Human-approved shared-code performance fix (2026-10-04)

The human explicitly approved extending INT-07 into lane B/S-owned shared code after reviewing the failed page measurements. Optimise task-log history processing while preserving exact totals, filtering, pagination, recurrence/DST, overrides/completions and RLS. The workload and sub-second budget remain unchanged. No new library, schema change or persistent cache is proposed.

Tests written before implementation: indexed recurrence counts/seeking against the existing expansion semantics, and task-log parity across types, statuses, title search, pages, cancellation/movement, mode changes, latest completion/undo, deactivation, month-end clamping and both Melbourne DST transitions. Initial run failed because recurrenceWindow and buildTaskLog are not implemented.

## FD-07 — Restrict opt-in Vitest discovery (2026-10-04)

Vite mergeConfig concatenated include/setupFiles arrays, accidentally bringing ordinary source tests into the Node-only performance environment when no explicit file was selected. Replace that merge with a dedicated config inheriting only the root resolve aliases. The corrected dedicated command runs exactly two files/four tests, all passing; post-merge Calendar query p95 is 708.050 ms over twenty samples. No assertions or test expectations were removed.

## FD-08 — Indexed task-log assembly and regression evidence

An isolated CPU profile on the synthetic fixture materialised 578,625 occurrences in 26,017 ms; time-zone conversion dominated samples, followed by sorting. Add a recurrence-window count/seek API using the existing anchor arithmetic, inclusive until and candidate cap. Range expansion now seeks directly to its first candidate. The task log counts ordinary instances, removes exceptional originals from those counts, processes overrides/completions with the existing occurrence builder, and materialises only selected ordinary page rows. Shared filtering/order logic remains the reference for exceptional rows. Database predicates, authentication and RLS are unchanged; no result cache or new dependency is introduced.

The two new correctness suites were red before implementation (commit 195a238), then green. Additional tests (754f6f6) exposed interval overflow and a spring-forward completion lookup discrepancy before correction; the original expectations were retained. A shifted 02:30 occurrence is keyed by its real 03:30 instant, so the indexed reader must recover the original candidate using the existing conversion. Counts/seeks retain valid anchors even if a later interval exceeds JavaScript's Date range. The focused recurrence/events/status suite now passes 12 files / 173 tests.

First optimized production run: Home p95 865.262 ms, Calendar 855.835 ms, Task log 498.068 ms; all twenty samples per route completed. These precede the final edge-case corrections; final measurements are recorded in PERFORMANCE_REPORT.md. The pre-fix measurements are retained in docs/INT-07-before.json.

Supabase CLI 2.117.0 was invoked through npx after the earlier CLI was no longer on PATH. No application dependency or lockfile changed. Main's existing additive overdue-alert migration was applied to the local database without reset so its pgTAP regression could run.

## FD-09 — Final validation and isolated database tests (2026-10-05)

Final unchanged-budget results: Home p95 822.447 ms, Calendar page 835.081 ms, Task log 510.408 ms, Calendar query 415.513 ms; twenty timed samples for each. The complete source verify passes 229 files / 2,681 tests with VITEST_MAX_WORKERS=4; affected real integration passes 26 tests; the final production build passes. Latest main remains 817aa9b.

The shared database pgTAP run encountered one existing test's global assumption that no profiles are inactive (929/930 passed). Preserve shared data and that assertion. Run the suite in a separate empty local database with the same application schema, object owners, grants, RLS and migration-defined private storage bucket: 34 files / 930 tests PASS. Initial schema-only setup attempts lacked a bucket configuration row and encountered an absent generated GraphQL wrapper grant; these setup attempts are recorded in the report, not reported as passing tests. No tracked SQL test, application schema or existing data was changed to obtain green.

Windows Git checkout line endings produced unrelated format warnings after merging main. Restoring unchanged HEAD blobs as LF allowed format validation; these files have no content diff and are excluded from INT-07 commits. No dependency or existing assertion was changed. The status-page generator could not query gh, so it retained prior PR metadata; its static housekeeping tables are explicitly labelled as a historical snapshot.
