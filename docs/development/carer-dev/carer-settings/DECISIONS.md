# Decisions — CAR-09 Carer — Settings

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-13 | Staff names and job titles | no | Full first + last name shown (CHG-032). Job titles are a per-organisation list, owned by ADM-02; not touched here. |

OQ-35 is ANSWERED (PD-054): per-card Save, Role read-only for carers, email is contact-only.

## Feature decisions log

### FD-01 — Feature docs rewritten before implementation; AC-04 and AC-05 added
- Date: 2026-09-29
- Context: the planning-pack docs described a screen and grant that now exist (CAR-UI-04, FAM-12). AC-01 to AC-03 did not cover Save, which PD-054 requires and CAR-UI-04 FD-06 handed to this feature.
- Decision: keep AC-01 to AC-03 (AC-02 also names role/organisation/active; AC-03 adds the failure case). Add AC-04 (Save persists) and AC-05 (validation and failure). Rewrite PRD scope and TEST_PLAN to match.
- Reason: the wiring cannot be tested or reviewed without them. No implementation had started.
- Alternatives considered: leave Save untested (rejected: PD-054 makes it in scope).
- Consequences: reviewer should read the AC changes. Flag in the PR.
- Human confirmation required: yes (PR review).

### FD-02 — No new migration
- Date: 2026-09-29
- Decision: reuse the FAM-12 grant (`update (first_name, last_name, phone, email, address)`) and `profiles_update_self`. `job_title` is not granted, so it is already rejected with 42501.
- Reason: no gap. T-02 proves it for a carer.
- Consequences: no `database.types.ts` change; if T-02 finds a gap, stop and record a CHG rather than adding a migration silently (migrations are Lane B).

### FD-03 — A carer-specific action, not `updateFamilyContactDetails`
- Date: 2026-09-29
- Decision: add `updateCarerContactDetails` and `carerInfoSchema` (family schema without address) in `src/server/profiles/`; reuse `splitName`, `CONTACT_COLUMNS`-style reads and `requestOwnPasswordReset`. `src/server/profiles/` belongs to Lane F (FAM-12); an additive change here is recorded as a cross-lane touch and flagged in the PR.
- Reason: `contactRowValues` writes `address`, so reusing the Family action would null a carer's address.
- Alternatives considered: make `address` optional in the Family action (rejected: changes a merged contract; a caller could then send it). Move the view's local `myInfoSchema` into `contact-schema.ts` as `carerInfoSchema` so the form and the action share rules (chosen, as FAM-12 FD-02).
- Human confirmation required: yes, tell the human about the Lane F folder touch (CLAUDE.md §4.2) before the PR.

### FD-04 — Non-blocking defaults used
- Date: 2026-09-29
- OQ-13: the full name is shown and saved as first + last, split at the first space (FAM-12 FD-03). The job-title list is untouched.
