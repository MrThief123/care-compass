# Decisions — F0-26 Custom sections on Client Details

## Open decisions affecting this feature
- OQ-38 (non-blocking, stays OPEN): this feature adds free custom headings only; summary flags, proforma forms and other requested fields stay parked.

## Feature decisions log

### FD-01 — Separate table `client_custom_info_sections`
- Date: 2026-10-12
- Decision: custom sections get their own table with a uuid id, title and DELETE policy. `client_info_sections` keeps its fixed `key` check and has no DELETE policy, so the built-ins can't be removed by accident; it is not changed.
- Human confirmation: not required (follows from "built-ins stay fixed", confirmed 2026-10-12).

### FD-02 — Who manages sections
- Decision: family, a carer on an active shift and an admin of the client's organisation may add, rename, edit and delete. Off-shift assigned carers read only. Matches who may edit section text today (CAR-04 FD-01, FD-07).
- Human confirmation: the human owner, 2026-10-12 (in-session).

### FD-03 — Limits (PROPOSED defaults)
- Decision: title 1–60 characters; text up to 5,000 (as the built-ins); at most 20 custom sections per client.
- Human confirmation: the human owner, 2026-10-12 (in-session, "yes").

### FD-04 — Delete confirms; audit keeps the text
- Decision: inline confirmation "Remove <title>? Its text will be lost." with Remove and Keep. The audit trigger stores the old row, so the text can be recovered by an operator. No restore in the UI.
- Human confirmation: the human owner, 2026-10-12 (in-session).

### FD-05 — No Figma design
- Decision: built from the existing section card, text field and inline confirm patterns (Remove bucket), with tokens only, as in F0-25 FD-05.

### FD-06 — Cross-lane edits kept in this PR
- Decision: `src/features/family-info/` (Lane F) and `src/features/carer-patients/` (Lane C) gain the custom-section list; Admin reuses `FamilyInfoView` (ADM-11). Flagged for review; precedent CHG-058.

### FD-07 — Implementation notes (2026-10-12)
- Pages read `getClientCustomSections` alongside `loadFamilyInfoData` in one `Promise.all`, inside the existing try, after the access check; a rejected read shows each page's existing error state. The app pages under `src/app/(family|carer|admin)/…/info/page.tsx` change by that one read and one prop.
- The 20-section limit trigger is SECURITY DEFINER and takes a per-client advisory lock, so two adds at once can't both take the 20th place.
- `database.types.ts` regenerated with `npm run db:types` and formatted; the only change is the new table.
- The custom cards' Remove has the built-in Edit's 20px inset so the right edges line up; Edit and Remove sit on the heading row and wrap under a long title.
- Seed: Margaret has "Communication" (written) and "Sleep" (empty) for local previews.
- No new dependencies.
