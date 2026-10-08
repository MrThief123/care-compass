# Decisions — F0-25 Client Documents page

## Open decisions affecting this feature
None.

## Feature decisions log

### FD-01 — No migration: "date added" is `documents.uploaded_at`
- Date: 2026-10-08
- Decision: the schema already has `uploaded_at timestamptz not null default now()`, `size_bytes` and `filename` (F0-13). Sorting by date added, size and name needs no schema change.
- Human confirmation: not required (the human asked to check the schema; checked).

### FD-02 — New dependency `fflate` for zip
- Date: 2026-10-08
- Decision: add `fflate` (pure JS, streaming `Zip` + `ZipPassThrough`, no compression). No other zip or archive library exists in the project.
- Human confirmation: the human chose "single .zip via a server route", 2026-10-08 (in-session).

### FD-03 — Download-all limit
- Decision (PROPOSED default): at most 300 documents per download; above that the route refuses with a clear message. Documents are streamed one at a time so memory stays flat.

### FD-04 — Download all ignores the search filter
- Decision: always every document, so "all" means all. The button shows the total count.

### FD-05 — No Figma design; built from tokens and existing tiles/table kit
- Decision: recorded as in FAM-17 FD-04.

### FD-06 — Existing test expectations that change
- Rail nav and patient tab expectations gain the Documents entry. Recorded in PROGRESS.md as HUMAN REVIEW: test expectation changed.

### FD-07 — Carer access not limited to shifts
- Date: 2026-10-08
- Decision: view and download for any assigned patient, as RLS already allows. Upload stays on-shift only (PD-041) and is not on this page.
- Human confirmation: the human, 2026-10-08 (in-session).

### FD-08 — Shared Lane S edit
- `src/components/shared/nav-config.ts` gets one additive Family item (flagged, kept in this PR; precedent FAM-17 FD-02).

### FD-09 — Download all is a plain link
- The link points at the zip route with `download`. A refusal (mock mode, 401, 404, 413) shows the browser's own failed-download notice rather than an in-page message. Revisit if users hit the 300-file limit.

### FD-10 — Zip stream failure after the first file
- The first file is read before the response starts (clean 502). A later failure errors the stream so the browser reports a failed download instead of saving a broken archive.

## Test expectation changes
- `src/components/shared/rail.test.tsx` [F0-15][AC-02]: Family rail list gains "Documents" after "Info" (before: Home, Info, Calendar, Budget, Settings). Reason: recorded requirement change CHG-058.
- `src/features/carer-patients/carer-patients.test.tsx` [CAR-UI-02][AC-07]: patient tabs gain "Documents" after "Info" and its href. Reason: CHG-058.
- HUMAN REVIEW: test expectation changed (both are additions, no assertion removed).
