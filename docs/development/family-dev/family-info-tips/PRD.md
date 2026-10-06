# FAM-17 — Family — Info tips on main buttons

| Field | Value |
|---|---|
| Feature ID | FAM-17 |
| Dashboard / stream | Family |
| Phase | Phase 3 polish (sprint) |
| PR target | `main` (CHG-036) |
| Feature branch | `feature/family-info-tips` |
| Documentation | `docs/development/family-dev/family-info-tips/` |
| Status | See PROGRESS.md |

## Purpose
Say in a few words what a main button does, without leaving the screen.

## Problem
CIS3 Access 6 and CM-0309 ask for "?"/"i" help bubbles and contextual help. Parked as PL-05 (OQ-25). Family members are not always technical; "Edit" or "Export" alone does not say what will happen.

## Description
A small "i" button sits beside the main Family buttons. Hover, keyboard focus or a click or tap opens a short one-sentence tip. Esc, moving away or a click elsewhere closes it. One hand-rolled `InfoTip` component; the wording lives in one map.

## User value
Families understand a button before pressing it.

## Users
- Family

## Scope
- New `InfoTip` in `src/components/ui/info-tip.tsx` (flagged additive Lane S edit, one new file; FD-02): a toggletip, hover + focus + click, Esc, 44×44px target, token colours only.
- Help-text map `src/features/family-help/help-text.ts`: one sentence each, at most 100 characters.
- Placed next to: Home "Enter event"; Calendar "Enter event"; Budget "Edit"; Budget History "Export".

## Out of Scope
- Editable FAQ, staff discussion board (stay parked, PL-04/PL-05, OQ-25).
- Carer and Admin dashboards (later features; must be unchanged).
- Guided tours, inline helper text, new dependencies.
- Editing help text in the UI.

## Functional Requirements
- The "i" button has an accessible name that says which button it explains ("About Enter event").
- The tip opens on pointer hover, keyboard focus and click/tap; closes on Esc, pointer leave (pointer may move onto the tip first), blur and outside click.
- `aria-describedby` links the button to the tip while it is open.

## UI / UX Requirements
- Tokens only; white text never on #0C9BA9; status not colour alone; 44×44px target (icon itself small).
- Tip is not clipped on a 1280px-wide screen and wraps at narrow widths.
- No design in Figma (OQ-19 style gap): built from tokens, recorded in FD-04.

## Dependencies
- Features: FAM-UI-01, FAM-UI-02, FAM-UI-05, UI-02 (all merged)
- Blocking open decisions: None
- Non-blocking open decisions: OQ-25 (FAQ and discussion board stay parked)

## Inputs
- `label` (what the button is called) and `text` (tip) per placement.

## Outputs
- Rendered tip; no data read or written.

## Error / Edge Cases
- Touch: tapping the "i" opens; tapping elsewhere closes.
- Tip near the viewport edge stays on screen.

## Security / Permissions
- No data, no RLS impact. Family-only placement.

## Technical Considerations
- PROPOSED: positioned with CSS (absolute under the button), no positioning library.

## Traceability
- Product requirements: PL-05 (CHG-057)
- Sources: CIS3, CIS5, CM-0309

## Labels
CONFIRMED · PROPOSED
