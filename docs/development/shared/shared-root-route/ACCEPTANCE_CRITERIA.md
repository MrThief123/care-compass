# Acceptance Criteria — F0-19 Root route and production guard for dev previews

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given a signed-out visitor, when they open `/`, then they are redirected to `/sign-in`. | MET |
| AC-02 | US-01 | happy | Given a signed-in admin, carer or family user, when they open `/`, then they land on their role home (family: first client's home, or `/no-client-linked`). | MET |
| AC-03 | US-01 | permission | Given production, when anyone opens `/dev-preview` or any `/dev-preview-*` route, then the response is 404. | MET |
| AC-04 | US-01 | happy | Given development, when a developer opens `/dev-preview`, then the UI-kit showcase renders and its tabs work. | MET |
| AC-05 | US-01 | edge | Given an admin without AAL2, when they open `/`, then the existing MFA gate applies, not their home. | MET |
| AC-06 | US-01 | regression | Given the change, when the e2e and unit suites run, then no test or doc still treats `/` as the showcase. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
