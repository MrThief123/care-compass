# INT-07 — Scale and performance verification

Completed locally on 2026-10-05, based on main `817aa9b`. The human approved both the workload/budget (FD-01) and the shared-code fix (FD-06). The human approved opening the INT-07 PR on 2026-10-05; PR creation is the final handoff action.

## Final results

All four operations pass the unchanged **p95 < 1,000 ms** budget. Each result uses one excluded warm-up and **20 sequential timed samples**, with nearest-rank p95 (the nineteenth sorted duration). No concurrent regression suite ran during measurement.

| Operation | Final p95 | Result |
|---|---:|---|
| Calendar week query, AC-01 | 415.513 ms | PASS; 1,125 unique occurrences |
| Home full response | 822.447 ms | PASS |
| Calendar week full response | 835.081 ms | PASS |
| Task log first-page full response | 510.408 ms | PASS |

Raw, non-secret measurements are in [INT-07-after.json](INT-07-after.json); baseline samples are in [INT-07-before.json](INT-07-before.json). Environment: Windows 11, Node 22.15.0, Next 16.3.7, Intel Core i9-10900K (20 logical CPUs), 32 GiB RAM, local Supabase and a production Next build.

Page measurements include server rendering and complete HTTP transfer over loopback; they exclude browser hydration. Requests use a real synthetic family session and RLS. Every measured response must have HTTP 200, scale-task content and no known error text. The Calendar query directly calls the real contract with only Next's cookie/header context supplied by the harness. Calendar range: 28 September–4 October 2026, including the Melbourne spring-forward transition; Home and Task log use the actual run date.

## Workload and original finding

The isolated synthetic organisation contains **50 clients × 500 recurring events**: 125 daily, 125 weekly, 125 monthly and 125 yearly per client, anchored on 4 January 2016. Only the first client is linked to the benchmark family; all clients contribute to database size and RLS selectivity. The repeatable seed uses reserved synthetic IDs, refuses hosted URLs and never resets the shared database.

Before the fix, the week-range query passed, but whole-page responses failed:

| Operation | Timed response 1 | Timed response 2 |
|---|---:|---:|
| Home | 64,768.772 ms | 68,137.809 ms |
| Calendar week | 31,669.834 ms | 32,835.825 ms |
| Task log first page | 31,862.050 ms | 30,895.745 ms |

Those runs stopped after two over-budget responses: even if the remaining eighteen were instantaneous, the nineteenth sorted duration could not pass. **No twenty-sample baseline page p95 is claimed.** Passing runs still require all twenty samples. An earlier UI-sign-in setup timeout produced no usable page timings and is excluded (FD-04/FD-05).

A separate CPU profile built 578,625 historical occurrences in 26,017 ms. Time-zone conversion dominated samples, followed by sorting. `getTaskLog` previously expanded and sorted all history before filtering/paging; Home called it twice, Calendar and Task log once.

## Change and correctness

The recurrence engine now counts and seeks candidate indices with the same anchor arithmetic, inclusive end date and 100,000-candidate safety cap. Range reads seek directly to their first candidate. Task-log reads count ordinary instances without building them, process overridden/completed instances through the existing occurrence/status builder, and assemble only the selected ordinary page rows. No persistent result cache or new application dependency was added.

Tests compare exact items and totals against the existing full-expansion semantics across title search, type/status filters, pages (including out-of-range), month-end/leap-day clamping, cancellation, moved occurrences, mode changes, completion/undo, deactivation, assignees and Melbourne DST. Additional failing tests caught large-interval overflow and completion keys shifted across the spring-forward gap; both were fixed without changing their assertions. The database reads and RLS predicates are unchanged. Real integration tests include cross-client denial checks.

## Query plans and indexes

`scripts/explain-scale.sql` runs read-only authenticated-family EXPLAIN ANALYZE for the underlying reads. Existing plans use `care_events_client_id_starts_at_idx` (~116 ms), `care_event_overrides_client_id_idx` (~0.025 ms), and `care_event_completions_client_id_idx` (~0.046 ms); the shift-carer function was ~1.8 ms. These initial plans identified no missing index. No schema migration was added by INT-07.

## Validation

- `DATA_SOURCE=mock`, `VITEST_MAX_WORKERS=4`, `npm run verify -- src`: **PASS**, lint/typecheck/format and **229 source files / 2,681 tests**. Three pre-existing lint warnings remain. The Windows checkout's CRLF conversion was corrected from unchanged HEAD blobs for verification; no unrelated content change is included.
- Focused recurrence/events/status suite: **12 files / 173 tests PASS**.
- Affected real Supabase integration suite: **6 files / 26 tests PASS** (`care-events`, `family-task-log`, `family-calendar-tasks-log`, `family-calendar-views`, `family-home-overdue-activity`, `shared-access-control-regression`).
- Dedicated performance Vitest config: **2 files / 4 tests PASS**.
- Production `npm run build`: **PASS**.
- Dedicated production Playwright performance config: **3 tests PASS**, twenty timed responses each.
- `supabase test db`: **34 files / 930 tests PASS** in an isolated local database with the same application schema, owners, grants and migration-defined private storage bucket.

The shared database pgTAP run passed 929/930: an existing admin-deactivation test globally assumes zero inactive profiles and encountered one pre-existing inactive profile. Neither that assertion nor shared data was changed. The passing run used a separate database with no application rows. A schema-only clone initially omitted the migration-created storage-bucket row; it was then inserted directly from the existing migration. An absent generated GraphQL wrapper grant was omitted from clone setup; Care Compass application functions, tables, owners, grants and RLS were retained. Tests create their own synthetic rows and roll them back. Setup attempts are not counted as passing regressions.

## Reproduction

Use an existing migrated local Supabase stack and ignored `.env.local` with local credentials and `DATA_SOURCE=supabase`:

```powershell
node --experimental-strip-types scripts/seed-scale.ts
npx vitest run --config tests/performance/vitest.config.ts
npm run build
npx playwright test --config tests/performance/playwright.config.ts
```

Runtime evidence is written to ignored `test-results/int07`. Seed data is retained for repeat runs. On a clean dedicated test database, run `npx supabase test db`; an isolated database can be selected with `--db-url` using a local URL. Do not reset another lane's shared stack to obtain clean-test assumptions.

## Limits

This is local single-user assurance, not production load testing or a hosting SLA. The scale fixture has no large persisted completion, override, shift, document or budget history; correctness cases cover those semantics at smaller sizes. Deep task-log pages and large exception histories can still require more work than page one and are not covered by the sub-second result. No claim is made for every possible lifetime-data mix.
