# Decisions — ADM-01 Admin Home — counts and overdue events

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-29 | Which nurse is shown on an event | YES | Derive from the carer whose shift covers the occurrence start; '—' if none; for Done show the actor. |
| OQ-37 | Admin Home overdue row destination | no | Omit navigation until an admin detail view is designed (PL-20). |

## Feature decisions log

### FD-01 — Upcoming shifts wired live (CHG-034); overdue window and cap; staff count scope
- Date: 2026-09-29
- Context: root DECISIONS.md CHG-034 (this session, human-confirmed) brought Upcoming shifts into
  ADM-01's own scope, reversing CHG-006's "no live shift queries" restriction. Separately, the PRD's
  own Technical Considerations/Error cases leave two PROPOSED implementation details unconfirmed
  ("expand only recent window, PROPOSED last 30 days" for overdue; "large volume → PROPOSED show 20
  newest + load more"), and AC-01's "Staff" figure needed a precise scope (all profiles, or carers only).
- Decision:
  - Upcoming shifts: `getAdminHome()` reads `shifts` (joined to `clients`/`profiles`), `cancelled_at is
    null`, `starts_at > now()`, ordered by `starts_at` ascending, capped at 20 rows (no "load more" UI
    exists to page further — same reasoning as the overdue cap below).
  - Overdue: derived per client via `loadOccurrences` (F0-11) over a 30-day window ending today
    (Melbourne), looped across the organisation's clients with `Promise.all` — there is no existing
    org-wide aggregate (the recurrence engine is TypeScript, F0-09, not SQL, so an org-wide SQL RPC
    would duplicate it, a second pattern for the same problem, CLAUDE.md §7). Sorted newest-first
    (latest occurrence start first) and capped at 20, matching the PRD's own PROPOSED default; no "load
    more" control is built since none exists in the shipped UI (ADM-UI-01) and it is not in any AC.
  - Staff count (AC-01): active carers only (`profiles.role = 'carer' and is_active`), not admins —
    matches AC-01's literal wording ("Staff shows... the active carer count") and PD-039 (deactivation
    is carer-only work; ADM-03's later scope).
  - Nurse name: full name (PD-038), reading `Occurrence.assignee` as `loadOccurrences` already derives
    it via `client_shift_carers` (PD-055) — no new logic needed, but AC-02's design-era "Aisha R."
    abbreviated text is corrected to match PD-038 (see ACCEPTANCE_CRITERIA.md).
- Reason: no existing infrastructure computes any of these org-wide; each choice follows an existing,
  already-confirmed decision (PD-038, PD-039, PD-055, F0-09's TS-only recurrence engine) rather than
  inventing a new one, except the 20-row caps and 30-day window, which are the PRD's own PROPOSED
  defaults, adopted as written since neither is a blocking OQ.
- Alternatives considered: a new SQL RPC expanding recurrence org-wide (rejected — duplicates F0-09's
  TypeScript engine); uncapped overdue/upcoming lists (rejected — the PRD's own Error/Edge Cases flags
  large-volume risk, and nothing bounds an org's event or shift volume).
- Consequences: `src/server/admin/queries.ts` gains an org-wide fan-out (up to ~4 queries per client
  for overdue, bounded by the org's client count) — flagged for PR review as a performance
  consideration if an organisation's client count grows well past the ~42 the design assumes.
- Human confirmation required: CHG-034's upcoming-shifts-in-scope decision, yes (human, 2026-09-29). The
  30-day window, 20-row caps and staff-count scope are PROPOSED-default/unambiguous-AC-reading
  implementation choices, not blocking OQs — flagged here for review rather than asked in advance.
- Test changes caused: `src/server/admin/queries.test.ts`'s `[ADM-UI-01][AC-01] does not silently
  serve mock totals in Supabase mode` (asserted `getAdminHome()` throws not-implemented) removed, since
  ADM-01 wires exactly that function — same reasoning as FAM-10's FD-01. Replacement coverage:
  `tests/integration/admin-home.test.ts`. Flagged HUMAN REVIEW in PROGRESS.md and the PR.

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
