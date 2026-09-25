# Decisions — ADM-UI-02 Admin Manage

## FD-01 — Isolated preview and data contract
- Human requested Manage after the Admin Home preview workflow; use an isolated worktree from admin-dev and keep changes local for visual review before committing.
- Human explicitly approved adding Manage's query and fixtures in shared/backend folders on 2026-09-22.
- Added src/server/admin/manage-queries.ts and src/mocks/admin-manage.ts. Separate filenames avoid collisions with the unmerged Admin Home query.
- Reuse the existing mock/Supabase data-source switch. Supabase mode remains unimplemented for this Phase 1 screen.

## FD-02 — Non-blocking defaults and conflict copy
- OQ-09 is ANSWERED in root DECISIONS.md; this fixture screen performs no real access-control writes.
- OQ-21 remains OPEN/non-blocking: use its documented fixed-slot MVP default, with Custom; no recurring shift control.
- OQ-39 remains OPEN/non-blocking: calculate warning text from actual fixture shifts. The design's selected 07:00–11:00 does not overlap 11:30–13:00, so no warning appears initially. Selecting 11:00–15:00 produces the warning.
- All shift intervals are same-day Melbourne wall times. Custom end must follow start; adjacent boundaries do not overlap. No recurrence engine is needed for single local shifts.

## FD-03 — Local state and accessibility
- Assign adds a shift only to component state and announces confirmation. Clear removes both selections; Cancel also resets date/time inputs. Completed local assignments remain until reload.
- Calendar dots reflect the selected staff member's shifts, including local additions.
- Reuse SelectableListRow, DatePickerGrid, ChipGroup, Field, InlineAlert and other primitives.
- Screen-local search controls supply explicit labels and searchbox roles. The existing SearchField lacks a label prop, so shared code is unchanged.
- Enlarge date picker targets locally to 44px and allow its container to scroll at narrow widths.

## FD-04 — Test helper correction
- T-02/T-03 and assignment tests originally passed an unsupported exact option to Testing Library getByRole.
- Removed that option; string name queries already match exactly. No expectation or assertion changed; this was a test typing defect.
- No dependencies added.

## FD-05 — Next.js conventions
- Follow installed Next.js 16.3.3 page/loading/error guides. Error boundary recovery uses retry.
- No architecture or controlled requirement changes needed.

## FD-06 — Human-requested display copy, 2026-09-23
- Show full names throughout Manage. Existing synthetic client surnames are Doyle, Hale, Marsh, Novak and Petrov. Daniel Kelly is a synthetic expansion of the abbreviated Daniel K.; existing shared fixtures remain unchanged.
- Remove the standing preview/reset notice and reset wording from the assignment confirmation, as requested. Assignment behavior remains local-only.
- Use ASCII hyphens with spaces in displayed time ranges (slots, overlap warnings, confirmation).
- HUMAN REVIEW: test expectation changed. T-01/T-03 and query/display assertions now expect full names and ASCII time separators, per the explicit human request. No behavioral assertion removed.

## FD-07 — Deterministic calendar layout tests (2026-09-23)
- Human approved editing the shared calendar tests on this branch and pushing the fix.
- Affected tests: DayTimeline 'renders the whole day so any hour can be scrolled to'; WeekGrid '[AC-02] renders the whole day and opens on the 07:00–18:00 focus window'.
- Before: omitted now, so the live clock could suppress hour labels near the current-time label; assertions intermittently failed on 00:00.
- After: pass now={null} for these static-layout tests. All hour-label and viewport assertions retained verbatim. Existing current-time tests still cover clock rendering.
- Reason: test isolation bug, not a requirement or production behavior change. No assertion weakened or removed.
- Validation: all 109 tests across the calendar and Manage regression suites pass; TypeScript passes.
