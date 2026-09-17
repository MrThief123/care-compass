# Acceptance Criteria — F0-05 Design tokens, typography and base styles

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given the token file, when the token test compares values with the Figma fixture, then every colour token hex matches exactly. | NOT MET |
| AC-02 | US-01 | validation | Given the approved text/background pairs list, when contrast ratios are computed, then every body-text pair is at least 4.5:1. | NOT MET |
| AC-03 | US-01 | validation | Given the pairs list, when it is checked, then it contains no pair of text/on-dark on bg/brand (#0C9BA9). | NOT MET |
| AC-04 | US-01 | happy | Given any Button rendered, when it receives keyboard focus, then a visible focus ring style is applied. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
