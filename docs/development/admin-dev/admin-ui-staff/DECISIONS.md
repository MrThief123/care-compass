# Decisions — ADM-UI-03 Admin Staff screen (UI)

Record feature-level decisions here using the template below. Project-wide decisions belong in root DECISIONS.md.

## Open decisions affecting this feature

| ID | Decision needed | Blocking? | Proposed default |
|---|---|---|---|
| OQ-13 | Staff names and job titles | no | Store first and last name; display first name + initial everywhere (matches design); job titles are a per-organisation editable list seeded with the three design values. |
| OQ-36 | Staff deactivation | no | Design a Deactivate action in the Add/edit panel with confirmation. |

## Feature decisions log

_No decisions recorded yet._

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

### FD-01 - Staff screenshot and approved query exception (2026-09-23)
- User supplied Screenshot 2026-09-23 122747.png and explicitly approved adding the Staff query and fixtures.
- Approved exception: src/server/admin/staff-queries.ts and src/mocks/admin-staff.ts.
- Follow the left staff table and right always-visible Add / edit staff panel. Initial selection is Aisha Rahman.
- Use full names per the user and PD-038, including Daniel Kelly and Priya Iyer. Synthetic .example emails and dummy phones replace screenshot contacts.
- Staff role labels follow the screenshot and ACs. Existing unrelated shared fixtures are unchanged.
- Root answered OQ-13/OQ-36 decisions supersede the historical proposed-default table above. Deactivation stays out of this UI feature per PD-039.
- Local state only; no persistence/auth/database changes and no preview-reset explanatory line.

### FD-02 - Preview workflow and validation (2026-09-23)
- Continue the human's established Admin preview-first workflow: isolated Admin branch, no commits or push until review.
- Email uses shared Field with text input so Zod supplies consistent inline feedback rather than native browser validation intercepting submission.
- No existing tests or expectations changed.
- Next.js installed documentation specifies retry for error boundaries; implemented retry accordingly.
- Local font download has certificate failure; fallback font is visible. Human visual review is still required.

### FD-03 - Label capitalization (2026-09-23)
- Human requested Staff List, Add Staff and Add / Edit Staff capitalization.
- AC-03 and empty-state test button matchers updated from Add staff to Add Staff for this explicit copy change; no assertions removed or behavior changed.
- Human also requested removal of the visible Edit column heading; row Edit buttons retain full-name accessible labels.
- Accessibility check caught an empty table header. Keep Edit as screen-reader-only header text using a screen-local class; it is not visible.

### FD-04 - Clock-independent calendar assertions (2026-09-24)
- Human explicitly authorized diagnosing/fixing the Staff CI failure, including shared test edits, and committing the fix.
- Root cause: the live clock label deliberately suppresses overlapping hour labels, so the static DayTimeline test fails near 18:00 (or another asserted hour).
- DayTimeline "renders the whole day so any hour can be scrolled to" and WeekGrid AC-02 "renders the whole day and opens on the 07:00-18:00 focus window": before, default live clock; after, now={null}.
- Existing hour and viewport assertions are unchanged. No assertions removed, production behavior changed, or tests skipped. Dedicated current-time tests remain intact.
- Same narrow fix previously applied on Manage; copied only the two test changes, not Manage feature code.
- Synced current origin/admin-dev as required. Resolved Admin layout conflict by retaining both full names and upstream sign-out control.
- Validation: all 105 calendar and Staff tests pass.
