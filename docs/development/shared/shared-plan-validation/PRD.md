# F0-01 — Validate planning pack against repository, Figma and sources

| Field | Value |
|---|---|
| Feature ID | F0-01 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-plan-validation` |
| Documentation | `docs/development/shared/shared-plan-validation/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D1 |
| Status / owner | See PROGRESS.md |

## Purpose
Make the planning pack authoritative only after it has been checked against reality.

## Problem
The plan was produced without repository access. A team meeting (4/9) claims CI, Supabase schema and RLS tests exist, while the human reports an empty Next.js scaffold. Figma MCP exposed only the Foundations page; screens were supplied as images.

## Description
Docs-only feature. Claude Code inspects the actual repository, the Figma file and any newly supplied sources, reconciles them with this planning pack, records answers to open decisions and moves features from NOT STARTED to PLANNED or BLOCKED.

## User value
Stops the team building on an unverified plan; converts assumptions into confirmed facts or explicit questions.

## Users
- Development team (human)
- Claude Code

## Scope
- Inspect repository: package manager + lockfile, Next.js version, App Router vs Pages Router, TypeScript config, Tailwind version, existing lint/test config, existing `supabase/` directory, CI workflows, branches that already exist.
- Inspect Figma via MCP: list pages; confirm whether pages 02–06 (screens, states) are now reachable; record node IDs for each screen in `docs/design/FIGMA_INDEX.md`.
- Check `docs/sources/` for newly added source documents listed as missing in DECISIONS.md OQ-19 and record what was added.
- Update ARCHITECTURE.md labels (CONFIRMED / PROPOSED / UNKNOWN) using repository facts.
- Record answers the human gives to open decisions (OQ-xx) in DECISIONS.md as PD-xxx entries.
- Re-derive each feature's status: PLANNED when docs are complete and no BLOCKING decision remains; otherwise BLOCKED with the blocking OQ IDs.
- Write `docs/VALIDATION_REPORT.md` summarising every check, discrepancy and resulting documentation change.
- Declare the planning freeze in DECISIONS.md once the human approves the report.

## Out of Scope
- Installing dependencies or changing any non-documentation file
- Creating dashboard development branches (done in F0-02 after validation)
- Answering open decisions on the human's behalf

## Functional Requirements
- Every discrepancy between plan and repository is listed with file path evidence.
- Every OQ in DECISIONS.md has a current status (OPEN / ANSWERED / SUPERSEDED).
- No feature is marked PLANNED while a BLOCKING OQ that lists it remains OPEN.

## UI / UX Requirements
- None (documentation only).

## Dependencies
- Features: None
- Blocking open decisions (must be answered before START FEATURE): OQ-01, OQ-20
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-19, OQ-02

## Inputs
- Repository working tree
- Figma file DFcLy7U1caCVNlhT6eazF5
- docs/sources/*
- Human answers

## Outputs
- docs/VALIDATION_REPORT.md
- docs/design/FIGMA_INDEX.md
- Updated ARCHITECTURE.md, DECISIONS.md, PROGRESS.md, DEVELOPMENT_PLAN.md statuses

## Error / Edge Cases
- Figma MCP still returns only one page → record as UNKNOWN, reference exported images in docs/design/screens/ and keep OQ-19 open.
- Repository already contains application code or a Supabase schema → stop and ask the human which is authoritative (OQ-20) before editing plans.

## Security / Permissions
- Do not copy credentials from source documents (e.g. Client Information Sheet 2 contains third-party passwords) into the repository.

## Technical Considerations
- Documentation-only commits: `docs(plan): ...`.

## Traceability
- Product requirements: REQ-N9 (Maintainable with comprehensive plain-English handover documentation.)
- Sources: User planning constitution §4, §30; TM-0409 (repo state claims); UI-§9; FIG
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
