# Decisions — F0-13 Client document storage

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-01 | Branch parent and naming for shared (foundation and cross-cutting) work | YES | Option B (recommended): `feature/shared-<name>` branched from `main`, PR → `main` with mandatory human review, then `main` merged into all three dev branches. Option A (strict): host shared work in `family-dev` as `feature/family-shared-<name>` and promote via release. Claude Code must not start any shared feature until this is answered. |
| OQ-26 | File upload constraints | YES | PDF, JPEG, PNG, HEIC, DOCX up to 20 MB; video excluded for MVP; storage cost documented in handover. |

## Feature decisions log

_No decisions recorded yet._

### FD-01 — Access mirrors general client access, not care-events' shift-restricted edit rule
- Date: 2026-09-27
- Context: PRD Description says access "mirrors client access" but doesn't name a specific rule. F0-11 already has two: `can_read_care_events` (family, assigned carer or admin of client) and `can_edit_care_events` (family always; a carer only during an active shift). Documents are used from Family, Carer and Admin per the Users list, with no AC distinguishing an off-shift carer.
- Decision: one function, `can_access_client_documents(client_id)` = `is_family_of` or `is_assigned_carer` or `is_admin_of_client` (the same union as `can_read_care_events`), used for both read and write (insert, and the one updatable column, `detached_at`). A new function rather than calling `can_read_care_events` directly, so documents' access can diverge later without touching F0-11's.
- Reason: nothing in scope restricts carer uploads to an active shift, and the PRD's own Users list treats all three roles the same way for this feature.
- Alternatives considered: reusing `can_edit_care_events`'s shift restriction for uploads (not chosen — no AC or PRD line asks for it, and it would block a carer attaching a document at the exact moment CAR-02's dependency chain implies they can).
- Consequences: CAR-04 (Carer client info, dependency on F0-13) should flag it if the human wants uploads shift-restricted; this function is the one place that would change.
- Human confirmation required: yes (whether documents should follow the same active-shift rule as editing care events)

### FD-02 — No hard delete, enforced with an append-only trigger, the same as audit_log and care_event_completions
- Date: 2026-09-27
- Context: PRD Scope: "No hard delete: `detachDocument` sets detached_at (perpetual retention, CIS3)." There is no DELETE policy on `documents`, so an ordinary user's DELETE already matches zero rows under RLS and does nothing — but the table owner and the service role bypass RLS entirely, so without something more a privileged script or console could still delete a row.
- Decision: a `before delete` trigger (`documents_reject_delete`) raises 42501 for every DELETE, including from the table owner and the service role — the same pattern `audit_log` (F0-08) and `care_event_completions` (F0-11) already use for their own append-only guarantees.
- Reason: CIS3's "retained in perpetuity" should hold against a mistaken admin script, not only against RLS.
- Alternatives considered: RLS alone (leaves the service-role/table-owner gap above).
- Consequences: even a future "hard delete for GDPR-style erasure" request needs a deliberate migration change here, not a one-off DELETE — flag it if that ever comes up.
- Human confirmation required: no (directly requested by the PRD; reuses an existing pattern)

### FD-03 — HEIC uploads accept both `image/heic` and `image/heif`
- Date: 2026-09-27
- Context: PD-051 names "HEIC" specifically. In practice a HEIC photo is sometimes reported by the browser/OS as `image/heif` (they're the same container family; HEIC is one profile of HEIF).
- Decision: the bucket, the `documents.mime_type` CHECK constraint and `validateDocumentFile`'s allowlist all accept both `image/heic` and `image/heif`. The file-signature check for both is the same (an ISO base media `ftyp` box), not a specific brand, since brand codes vary by device.
- Reason: rejecting a real HEIC photo because the OS declared it `image/heif` would contradict PD-051's intent (accepting phone photos) on a technicality.
- Alternatives considered: `image/heic` only, exactly as written (would reject some genuine HEIC photos depending on the sending device/browser).
- Consequences: none for the four other types, which have one unambiguous MIME type each.
- Human confirmation required: no (minor, corrects for real device behaviour rather than changing what PD-051 intended)

### FD-04 — `database.types.ts` is not regenerated; a narrow typed wrapper stands in
- Date: 2026-09-27
- Context: `documents` is new, so it is not in `src/lib/supabase/database.types.ts`. F0-12 and F0-17 both hit the same gap: regenerating changes about 1,500 lines and then breaks typecheck in `src/app/api/test/route.ts`, outside this lane (F0-12's FD-04, still open).
- Decision: `src/server/documents/db.ts` casts `supabase.from` once, behind a small interface matching only the calls this feature makes (insert/select/update on `documents`). Nothing else in the codebase needs a cast.
- Reason: avoids a large, unrelated diff and a conflict with whichever branch regenerates the types.
- Alternatives considered: regenerate here anyway (rejected — same reasoning as F0-12/F0-17; three features hitting the same wall is itself a signal someone should just fix `api/test/route.ts` and regenerate once).
- Consequences: remove `db.ts`'s cast when the types are regenerated.
- Human confirmation required: no (follows F0-12's and F0-17's precedent)

### FD-05 — Test-writing mistakes found while running the tests (recorded per TESTING.md §6)
- Date: 2026-09-27
- Context: see TEST_PLAN.md "Test-writing mistakes found while running these" for the detail: a `has_table` call that silently checked the wrong thing because of which overload it resolved to, two `throws_ok` assertions that expected an exception RLS never raises (it filters rows instead), and two `plan()` miscounts.
- Decision: fixed as described in TEST_PLAN.md. No assertion was weakened, removed or skipped; the two rewritten assertions test the same guarantee more precisely (the row is provably unchanged) than the wrong one they replaced.
- Reason: genuine test bugs, found on first run, not a change in what's being tested.
- Alternatives considered: none.
- Consequences: none.
- Test changes caused: `documents.test.sql` (has_table description, two RLS assertions, plan count). Not flagged HUMAN REVIEW: no behaviour was relaxed.
- Human confirmation required: no

### Process note — schema and tests were developed together, not strictly red-first
The migration, the pgTAP tests, the pure validation module and its unit tests, and the
Server Actions were all written in one pass before anything was run, rather than tests
first/confirmed-red/then-implementation (CLAUDE.md §5). Schema, RLS and the tests that prove
them are hard to sequence otherwise without guessing at column names twice. Once written,
everything was run for real against a local Supabase stack and fixed until green (see
PROGRESS.md); nothing here is claimed to work without having been run. Flagging this as a
process deviation rather than presenting it as textbook TDD.

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
