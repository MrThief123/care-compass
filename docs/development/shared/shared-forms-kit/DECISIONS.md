# Decisions — UI-02 Forms kit: fields, settings cards, side panels, chips, modal, event form

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

All four are now ANSWERED in root DECISIONS.md; none blocked implementation.

| ID | Decision needed | Blocking? | Status | Answer applied here |
|---|---|---|---|---|
| OQ-01 | Branch parent and naming for shared work | YES | ANSWERED 2026-09-17 | Option B — `feature/shared-forms-kit` branched from `main`, PR → `main`. |
| OQ-10 | Status behaviour and undo | no | ANSWERED (PD-044) | Overdue is derived, never user-selectable — see FD-01. |
| OQ-22 | Event fields | no | ANSWERED (PD-047) | Title / Start time / Duration belong on the event form — see FD-03. |
| OQ-35 | Settings forms save behaviour | no | ANSWERED | `DetailsFormCard` takes a per-card Save affordance — see FD-05. |

## Feature decisions log

### FD-01 — Overdue is rendered as a non-selectable chip
- Date: 2026-09-19
- Context: the Edit event frame (`docs/design/screens/family-03-edit-event.png`) draws Planned / Done / Overdue as three equally selectable chips. PD-044 (answering OQ-10, CONFIRMED 2026-09-17) states Overdue is derived when the due time passes without a completion and "is never user-selectable".
- Decision: `ChipGroup` gained a per-option `disabled` flag; `EventForm` renders Overdue with `disabled: true`. It stays visible so an already-overdue occurrence reads correctly, but it cannot be chosen and `onChange` never fires for it.
- Reason: the answered decision outranks the frame (CLAUDE.md §2 — decisions are the source of truth once closed). Hiding the chip entirely would make a genuinely overdue occurrence unreadable.
- Alternatives considered: omit the Overdue chip (rejected — loses the derived state's display); leave it selectable to match the frame (rejected — contradicts PD-044).
- Consequences: the Edit event design is now knowingly out of step with the build on this point. **Flagged for human sanity-check in the PR** per PD-053.
- Human confirmation required: yes — **CONFIRMED by Dhruv Verma, 2026-09-19**, reviewed as rendered at `/dev-preview-forms-kit`. Stays as built; the frame is the out-of-date artefact.
- Test changes caused: none.

### FD-02 — Recurring select offers all nine PD-046 frequencies
- Date: 2026-09-19
- Context: the frame shows a single "Weekly" value. PD-046 (CONFIRMED) fixes the option set at Does not repeat, Daily, Weekly, Fortnightly, Monthly, Every 2 months, Quarterly, Every 6 months, Yearly.
- Decision: `EventForm` renders all nine, labelled and ordered as PD-046 words them, typed against the existing `RecurrenceFrequency` domain enum so the kit and the schema cannot drift.
- Reason: PD-046 is answered and the domain type already carries the full set; building only "Weekly" would need rework at FAM-06.
- Alternatives considered: pass the options in as a prop per dashboard (rejected — would let three dashboards define three different recurrence vocabularies).
- Consequences: design gap built directly from tokens per PD-053. **Flagged in the PR.**
- Human confirmation required: yes — **CONFIRMED by Dhruv Verma, 2026-09-19**, reviewed as rendered at `/dev-preview-forms-kit`.
- Test changes caused: none.

### FD-03 — PD-047 / PD-044 event fields are left to the dashboard features, behind a slot
- Date: 2026-09-19
- Context: PD-047 adds Title, Start time and Duration to the event form; PD-044 adds a completion-mode toggle. Both decisions name **FAM-06, FAM-07, CAR-07** (not UI-02) as the features that implement them, and UI-02's own PRD Scope and AC-05 list only Date, Recurring, Status, Description and Documents.
- Decision: `EventForm` implements the PRD scope exactly, and exposes an `extraFields` slot rendered above Description. FAM-06 / FAM-07 / CAR-07 pass their PD-047 and PD-044 controls into it.
- Reason: honours scope control (CLAUDE.md §6 — new requirements are not folded in) while making sure the later features extend this layout instead of rebuilding it. Matches the slot pattern the PRD already uses for Documents and the save affordance.
- Alternatives considered: build the fields here (rejected — outside UI-02's Scope and its controlled ACs, and assigned elsewhere by the decisions themselves); no slot at all (rejected — would force a rewrite of the layout per dashboard).
- Consequences: FAM-06 / FAM-07 / CAR-07 own these fields and their validation.
- Human confirmation required: no.
- Test changes caused: none.

### FD-04 — A dev-only preview route for the kit
- Date: 2026-09-19
- Context: UI-01 established `src/app/dev-preview-calendar-kit/` because the kit's remaining defects were visual and jsdom cannot measure a line box. The same holds here (modal overlay and focus ring, chip contrast in selected/disabled states, the two-column grid collapsing, 44px targets), and PD-053 requires the design-gap additions in FD-01 and FD-02 to be sanity-checked by a human.
- Decision: added `src/app/dev-preview-forms-kit/`, marked dev-only in its docblock, with synthetic values only, and a stated deletion trigger (FAM-UI-03 / FAM-UI-06 / ADM-UI-02).
- Reason: without it the PR's design-gap items cannot actually be looked at.
- Alternatives considered: no preview (rejected — leaves FD-01/FD-02 unreviewable); Storybook (rejected — a second tool for a problem this repo already solved one way, CLAUDE.md §7).
- Consequences: one extra route to delete when the real screens land.
- Human confirmation required: no.
- Test changes caused: none.

### FD-05 — `DetailsFormCard` omits the Save button when no handler is passed
- Date: 2026-09-19
- Context: OQ-35's answer adds a Save button per card, but Organisation info is read-only for some roles and Role is read-only for carers.
- Decision: `onSave` is optional; with no handler the card renders no button at all rather than a disabled one.
- Reason: CLAUDE.md §7 — the UI hides disallowed controls (absent, not disabled).
- Alternatives considered: always render Save, disabled when not permitted (rejected by §7).
- Consequences: callers decide per role whether to pass `onSave`.
- Human confirmation required: no.
- Test changes caused: none.

### FD-06 — Regression scope run for this PR
- Date: 2026-09-19
- Context: this feature's TEST_PLAN "Regression scope" is the template boilerplate and names `supabase test db` and Playwright. `docs/AGENT_REFERENCE.md` ("Relevant suite before a PR") scopes those to features that touch schema or have an e2e AC.
- Decision: ran `npm run verify` (lint + typecheck + format check + full unit/component suite). No `supabase test db` and no Playwright — UI-02 touches no schema and has no e2e AC; its kit-component minimum is "component test per state/variant in AC + axe", which is met.
- Reason: AGENT_REFERENCE is the authoritative matrix; the TEST_PLAN line is untailored template text.
- Consequences: TEST_PLAN.md's Regression scope updated to say this.
- Human confirmation required: no.
- Test changes caused: none.

### FD-07 — `npm run build` fails on `/admin/clients`, pre-existing
- Date: 2026-09-19
- Context: a production build fails prerendering `/admin/clients` because `src/mocks/current-user` throws by design when `NODE_ENV === "production"` ("replaced by the real Supabase session in F0-07").
- Decision: not addressed here. Verified the identical failure on a clean `origin/main` checkout, so it is not a regression from this branch, and the guard is deliberate until F0-07 lands.
- Reason: the failing path (`src/mocks/current-user.ts`, `src/app/(admin)/**`, `src/server/auth/queries.ts`) is outside this lane's folders (CLAUDE.md §4.2) and outside this feature's scope.
- Consequences: Phase 1 cannot produce a production build until F0-07; noted in the PR so it is not mistaken for this feature's doing.
- Human confirmation required: no — informational.
- Test changes caused: none.

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
