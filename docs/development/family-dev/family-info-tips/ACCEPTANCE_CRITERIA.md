# Acceptance Criteria — FAM-17 Family — Info tips on main buttons

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given an InfoTip, then it renders a button named "About <label>" at least 44×44px, with the tip hidden. | NOT MET |
| AC-02 | US-01 | happy | Given the tip is closed, when the pointer hovers the "i", then the tip shows; when the pointer leaves, it hides. | NOT MET |
| AC-03 | US-01 | edge | Given the tip is open from hover, when the pointer moves onto the tip, then it stays open. | NOT MET |
| AC-04 | US-01 | happy | Given keyboard focus lands on the "i", then the tip shows and the button's `aria-describedby` points at it; blur hides it. | NOT MET |
| AC-05 | US-01 | happy | Given the "i", when clicked or tapped, then the tip toggles; a click outside closes it. | NOT MET |
| AC-06 | US-01 | edge | Given the tip is open, when Esc is pressed, then it closes and focus stays on the "i". | NOT MET |
| AC-07 | US-01 | happy | Given Family Home and Family Calendar, then "Enter event" has an info tip with its map text. | NOT MET |
| AC-08 | US-01 | happy | Given Family Budget, then "Edit" and History "Export" each have an info tip with their map text. | NOT MET |
| AC-09 | US-01 | edge | Given the help-text map, then every entry is non-empty and at most 100 characters; the page has no axe violations with a tip open. | NOT MET |
| AC-10 | US-01 | permission | Given the Carer and Admin dashboards, then no info tips appear and their screens are unchanged. | NOT MET |

Types: happy · validation · error · permission · empty · edge · security.
