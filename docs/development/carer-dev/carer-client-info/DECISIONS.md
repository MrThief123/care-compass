# Decisions — CAR-04 Carer — Client info

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-09 | Carer access model | YES | ANSWERED (PD-041; read follows shifts, CHG-027; edit only while a shift is in progress). |
| OQ-19 | Figma access and remaining design gaps | no | Claude Code re-checks Figma in F0-01; each gap blocks only the features that cite it. |

## Feature decisions log

### FD-01 — CAR-04 builds the shared Info read/save contract (FAM-09 not merged)
- Date: 2026-09-30
- Context: `getClientInfoSections` and `getClientDocuments` throw for Supabase; no action saves a section; RLS lets only family write `client_info_sections`. FAM-09 would build these but is not merged.
- Decision: CAR-04 builds the Supabase reads, `saveClientInfoSection` and the carer RLS migration. FAM-09 reuses them and adds only family rules.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session).

### FD-02 — Carer wrappers in `src/features/carer-patients/`
- Date: 2026-09-30
- Context: `InfoSectionCard` and `DocumentationCard` (Lane F) keep edits in local state and say uploads are unavailable. CLAUDE.md §4.2 forbids editing another lane's folder.
- Decision: carer components in `src/features/carer-patients/` render the same look and call the contract; `src/features/family-info/` is untouched. Possible convergence with FAM-09 later. Default, flagged for the human.

### FD-03 — No-access URL redirects to Patients (was not-found)
- Date: 2026-09-30
- Decision: `findCarerPatient` redirects to `/carer/patients` instead of `notFound()`, following AC-04. Changes the two [CAR-UI-02][AC-09] tests. HUMAN REVIEW: test expectation changed.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session).

### FD-04 — Info tab only
- Date: 2026-09-30
- Decision: Home, Calendar and Care log stay 'Coming soon' (they need a Lane F base-path/read-only change, CHG-028). Recorded as follow-up, not folded in.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session).

### FD-05 — Documents: carers upload on shift, cannot remove
- Date: 2026-09-30
- Decision: the migration narrows document and storage inserts for carers to an active shift (today any carer with read access can insert); `detach` stays as is for family and is not offered to carers in the UI.
- Human confirmation: Dhruv Verma, 2026-09-30 (in-session).

### FD-06 — Docs rewritten; PR target is `main`
- Date: 2026-09-30
- Decision: PRD Scope, ACs (AC-01 to AC-09), TEST_PLAN and USER_STORIES rewritten before code (CHG-026/027/028/032, PD-041). Branch from and PR to `main` (CHG-036), not `carer-dev`. Copy 'Your shift has ended, so changes can't be saved.' and the 5,000-character cap are the PRD's PROPOSED values, used as the defaults.

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
