# F0-19 — Root route and production guard for dev previews

| Field | Value |
|---|---|
| Feature ID | F0-19 |
| Dashboard / stream | Shared |
| Phase | Phase 2 — Backend & data layer (parallel with Phase 1) |
| Development branch (PR target) | `main` (CHG-036) |
| Feature branch | `feature/shared-root-route` |
| Documentation | `docs/development/shared/shared-root-route/` |
| Lane | S — Shared |
| Sprint | SPRINT · planned D11 |
| Status / owner | See PROGRESS.md |

> **Added by CHG-037, 2026-09-30.**

## Purpose
A deployed Care Compass opens on the sign-in page or the user's own dashboard, never on the UI-kit showcase.

## Problem
`src/app/page.tsx` is the UI-kit showcase (Home, UI-01, UI-02, Database tabs) and `src/proxy.ts` has no rule for `/`. The `dev-preview-*` routes are reachable in any environment. A production deploy would show developers' pages to families and carers.

## Description
`/` sends a signed-out visitor to `/sign-in` and a signed-in user to their role home (`resolveRoleHomePath`, F0-07). The showcase moves to `/dev-preview`. `/dev-preview` and every `/dev-preview-*` route return 404 when `NODE_ENV=production`, and stay as they are in development and test.

## User value
Families, carers and admins land on the real app.

## Users
- All roles; developers (previews keep working locally)

## Scope
- Root route `/`: redirect per sign-in state and role, reusing F0-07 routing. No new auth logic.
- Move the showcase from `src/app/page.tsx` to `src/app/dev-preview/`; update `DevPreviewNav` links.
- Production guard for `/dev-preview`, `/dev-preview-calendar-kit`, `/dev-preview-database`, `/dev-preview-forms-kit`: 404 in production.
- Update e2e specs and docs that name `/` as the showcase.

## Out of Scope
- New landing or marketing page. Sign-in page design. Deployment config. Removing the previews from the repo.

## Functional Requirements
- Signed out, `/` → `/sign-in`. Signed in: admin → `/admin/home`, carer → `/carer/home`, family → their first client's home or `/no-client-linked`. Admin without AAL2 follows the existing MFA gate.
- In production no dev-preview URL renders; each returns the standard 404.

## UI / UX Requirements
- No new UI. Redirects and 404 only.

## Dependencies
- Features: F0-07 (sign-in, role routing)
- Blocking open decisions: None

## Inputs
- Session cookie, environment.

## Outputs
- Redirect or 404.

## Error / Edge Cases
- Inactive or profile-less user at `/`: existing F0-07 behaviour.
- `DATA_SOURCE=mock`: `/` still resolves through the mock current-user path used by F0-07.

## Security / Permissions
- No dev page is exposed in production. No PII in redirects.

## Technical Considerations
- Read `node_modules/next/dist/docs/` for `proxy.ts` and redirects before coding (CLAUDE.md §14). Prefer the guard in one place; do not add a second routing pattern.
- Touches shared `src/app` and `src/proxy.ts`; no migration.

## Traceability
- Product requirements: REQ-02
- Sources: CHG-037; F0-07.

## Labels
None PROPOSED.
