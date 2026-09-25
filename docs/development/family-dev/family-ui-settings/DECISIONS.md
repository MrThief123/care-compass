# Decisions — FAM-UI-06 Family Settings screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Decisions affecting this feature

| ID | Decision | Status | Applied here as |
|---|---|---|---|
| OQ-06 | Organisation change model | ANSWERED → PD-036 | Family starts the change: 'Change' opens the confirmation. The picker is undesigned (OQ-19), so the confirm step stops at FD-01. |
| OQ-35 | Settings forms save behaviour | ANSWERED → PD-054 | Family info gets a Save button. The Email field is the contact email (`profiles.email`), never the login email. |
| CHG-023 | Contact details contract and fixtures | CONFIRMED (Dhruv Verma, 2026-09-25) | `getFamilyContactDetails`; AC-01 shows 'Helen Doyle'. |

## Feature decisions log

### FD-01 — Confirming 'Change organisation' says the picker is not available yet
- Date: 2026-09-25
- Context: PD-036 has 'Change organisation' go to an organisation picker and then a confirmation. The picker is not designed (OQ-19), and the real transfer is FAM-13 (Phase 3). The PRD Scope has 'Change' open the confirmation dialog directly.
- Decision: 'Change' opens the destructive dialog (AC-02). Confirming closes it and announces 'Choosing a new organisation is not available yet.' in a live region that is on the page from the start. Nothing else changes: the card and the header keep Banksia Home Care. Cancel, X and Escape close with no message (AC-03).
- Reason: a control that silently does nothing fails users, and simulating a switch would invent the undesigned picker's outcome. FAM-UI-04 FD-05 ('Add file') uses the same pattern.
- Alternatives considered: simulating the switch in local state; a silent close.
- Consequences: FAM-13 replaces the message with the picker and the transfer, and decides whether the picker comes before or after this dialog (PD-036 says picker first). The wording is undesigned. It is built from tokens and flagged for design review.
- Human confirmation required: given, Dhruv Verma, 2026-09-25 (in-session).
- Test changes caused: none (new tests only).

### FD-02 — 'Reset' shows a simulated confirmation and sends nothing
- Date: 2026-09-25
- Context: F0-07 has `requestPasswordReset()`, but FAM-12 wires it. Phase 1 sends nothing. PD-054 separates the contact email shown on this screen from the login email the reset link goes to.
- Decision: 'Reset' announces "We've emailed you a link to reset your password." in a live region. The message names no address, because the link goes to the login email, which this screen does not show. There is no confirmation step. Pressing Reset again repeats the same message.
- Reason: this previews the real flow without claiming which address the link went to.
- Alternatives considered: 'not available yet' wording; a confirmation dialog before the message (an undesigned step).
- Consequences: FAM-12 calls `requestPasswordReset()` and keeps this wording, or changes it through its own decision. The wording is undesigned and flagged for design review.
- Human confirmation required: given, Dhruv Verma, 2026-09-25 (in-session).
- Test changes caused: none.

### FD-03 — Family info: Save, validation, local state only
- Date: 2026-09-25
- Context: PD-054 adds a Save button per card, which the design does not draw. FAM-12 PRD requires phone and email to be validated. Phase 1 persists nothing.
- Decision: the card uses `DetailsFormCard` with `onSave` (the kit's primary 'Save', bottom right). The inputs are controlled and start from the contract values. Save validates with Zod through the kit's `fieldErrors` (`src/components/shared/forms/validation.ts`):
  - Name is required: 'Enter your name.'
  - Email, if filled, must be an email address: 'Enter an email address like name@example.com.'
  - Phone, if filled, may hold only digits, spaces, `+` and brackets, with 8 to 12 digits: 'Enter a phone number like 0412 345 678.'
  - Address is free text.

  Values are trimmed on save. If any field fails, nothing is saved, each bad field shows its message through `Field`'s error prop, and focus moves to the first bad field. If all pass, the trimmed values become the saved state and 'Saved.' is announced in a live region. Editing a field clears that field's error and the 'Saved.' message. A reload shows the fixture values again.
- Reason: PD-054 is answered, and the rules match FAM-12 so its Server Action can reuse the schema. The schema lives in `src/features/family-settings/` so FAM-12 can move it next to the action.
- Alternatives considered: no Save in Phase 1 (contradicts PD-054); saving on blur (not what PD-054 says).
- Consequences: the Save button is a visible difference from `family-05-settings.png`. It follows PD-054 and should be named in the PR's side-by-side notes. The messages are undesigned and flagged for design review.
- Human confirmation required: no (PD-054 is answered). Flag for design review: message wording and Save placement.
- Test changes caused: none.

### FD-04 — The dialog wording is FAM-13's
- Date: 2026-09-25
- Context: the PRD says "the D36 wording". The full text is written in `docs/development/family-dev/family-change-organisation/PRD.md` (FAM-13 Scope).
- Decision: the title is 'Change organisation?'. The body is "Switching {client first name}'s care to a new organisation keeps her routines, events, budget, documents and history. Assigned nurses and all future shifts will be cleared, and {organisation name} will lose access immediately. This can't be undone from your side." With the fixtures this reads Margaret and Banksia Home Care. The buttons are Cancel and Change organisation, destructive tone. The client name and organisation name come from `getClientHeaderSummary`, and 'her' is kept as FAM-13 writes it.
- Reason: one wording for both features, taken from the document that holds it.
- Alternatives considered: none.
- Consequences: 'her' is hard-coded, as in FAM-13, because the fixtures carry no pronoun. Raise it with the design owner if clients of other genders need different wording.
- Human confirmation required: no.
- Test changes caused: none.

### FD-05 — Empty, loading and error states
- Date: 2026-09-25
- Context: the PRD asks for loading, empty and error states "(States sheet)". The Settings screen always has its three cards, so an empty screen does not exist.
- Decision:
  - Loading: the route's `loading.tsx` shows a skeleton of the three cards with one labelled status.
  - Empty: a missing phone, email or address renders an empty input. A client with no current organisation (`organisationName` undefined) shows 'Not registered with an organisation.', and the 'Change' button is absent (CLAUDE.md §7: absent, not disabled). The kit's `SettingsActionCard` requires an action, so this card is built locally in `src/features/family-settings/`.
  - Error: a rejected read shows the shared `ErrorState` with Retry (`router.refresh()`). It logs `[family-settings] could not load settings data:` and the error's class only (ARCHITECTURE.md §12.5).
- Reason: PRD Scope; the same pattern as Family Info (FAM-UI-04 FD-06).
- Alternatives considered: a whole-screen empty state (it never applies).
- Consequences: the no-organisation wording is undesigned and flagged for design review. FAM-13 decides what a family with no organisation can do.
- Human confirmation required: no; the wording goes to design review.
- Test changes caused: none.

### FD-06 — Layout and long text
- Date: 2026-09-25
- Context: CLAUDE.md §7 and the width rule (nothing overlaps from 1920 down to 768 wide). `SettingsActionCard` puts the text and the button side by side with no wrapping rule on the text.
- Decision: the page is a single column with `gap` between cards and the 'Settings' `ScreenTitle` above, as the design draws it. The Family info grid is the kit's two columns from `sm` up. Long input values scroll inside the input. Long card descriptions wrap, and the button keeps its size (`shrink-0`, already in the kit). If the kit card overflows at 768px, wrap it in `src/features/family-settings/` and record it here; do not edit `src/components/shared/**`.
- Reason: CLAUDE.md §4.2 and §7.
- Alternatives considered: none.
- Consequences: a real-browser width sweep from 1920 to 768 is part of Done.
- Human confirmation required: no.
- Test changes caused: none.

### FD-07 — Folder and file names
- Date: 2026-09-25
- Decision: screen code lives in `src/features/family-settings/`. The route is `src/app/(family)/family/[clientId]/settings/page.tsx` (it replaces the "Coming soon." placeholder) plus `loading.tsx`. The contract is `src/server/profiles/queries.ts` with a mock in `src/mocks/queries/profiles.ts` (CHG-023). The Next.js guides in `node_modules/next/dist/docs/` are read before touching the route files (CLAUDE.md §14).
- Human confirmation required: no.

### FD-08 — A visually hidden h2 keeps the heading order
- Date: 2026-09-25
- Context: the page title 'Settings' is the screen's `h1` (as on Task log). The kit's `DetailsFormCard` and `SettingsActionCard` title their cards with `h3`, so axe `heading-order` fails (AC-09). `src/components/shared/**` may not be edited.
- Decision: a `sr-only` `h2` 'Your account and organisation' sits between the title and the cards, the same approach as `family-event-form` ('Event details').
- Reason: passes AC-09 without editing the shared kit or adding a second card pattern.
- Alternatives considered: a local copy of the kit cards with `h2` (a second pattern); an `h2` page title (the other family screens use `h1`).
- Consequences: screen-reader users hear one extra heading. If the kit gains a heading-level prop, drop this `h2`.
- Human confirmation required: no.
- Test changes caused: none.

### FD-09 — Family info is read-only until 'Edit' (CHG-024)
- Date: 2026-09-25
- Context: the human asked that Family info can't be changed by accident.
- Decision: the inputs render `readOnly` and the kit card's button reads 'Edit'. 'Edit' unlocks the inputs, focuses Name and relabels the button 'Save' (the kit's `saveLabel`). A valid Save keeps the values and locks the inputs again; an invalid Save stays in edit mode. 'Edit' also clears a 'Saved.' message. In edit mode a 'Cancel' button next to 'Save' puts back the last saved values, clears errors and locks the inputs again, with no announcement (AC-11, added in-session at the human's request).
- Reason: this uses the existing kit props `DetailsFormCard.saveLabel` and `Field.readOnly`, so `src/components/shared/**` is unchanged.
- Alternatives considered: plain text instead of read-only inputs (a second display pattern, and it breaks the layout match with the design).
- Consequences: read-only inputs look the same as editable ones (the kit's `read-only:` style only changes the cursor). FAM-12 keeps this flow when it wires saving.
- Human confirmation required: yes. Given in-session by Dhruv Verma, 2026-09-25.
- Test changes caused (recorded requirement change, CHG-024): T-06, T-07 and T-11 click 'Edit' before typing. Before: they typed straight into the inputs. After: 'Edit' first. No assertion was removed. In T-07's 'clears the Saved. message' case, the trigger for clearing 'Saved.' changed from typing in a field to clicking 'Edit', because the inputs are read-only after a save. T-11 also runs axe in edit mode. T-13 is new (AC-10).

### FD-10 — Family info card built locally for its Cancel button
- Date: 2026-09-25
- Context: AC-11 needs 'Cancel' next to 'Save'. The kit's `DetailsFormCard` renders one button and has no slot for a second, and `src/components/shared/**` may not be edited (CLAUDE.md §4.2).
- Decision: `family-settings-view.tsx` builds the card from `CardShell`, an `h3`, the same two-column grid classes and two kit `Button`s: Cancel (`secondary`, the same as `SidePanelForm`'s Cancel) and Edit/Save (primary). It is a local wrapper, not a new shared component.
- Reason: CLAUDE.md §4.2 allows a local wrapper in `src/features/<screen>/` when the kit lacks something.
- Alternatives considered: waiting for a shared PR that adds `onCancel`/`cancelLabel` to `DetailsFormCard` (the same props `SidePanelForm` has).
- Consequences: need for the shared kit: `DetailsFormCard` should take `onCancel`/`cancelLabel`. When it does, switch back to it. Carer and Admin settings (My info, Organisation info) will likely want the same flow.
- Human confirmation required: no (a wrapper allowed by §4.2). The human is told in-session.
- Test changes caused: none (T-14 is new).

<!-- Template
### FD-xx — <title>
- Date:
- Context:
- Decision:
- Reason:
- Alternatives considered:
- Consequences:
- Human confirmation required: yes/no (who, when)
- Test changes caused (if any): test ID, reason, flagged for review yes/no
-->
