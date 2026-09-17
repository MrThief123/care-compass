# F0-15 — Role app shell: rail, header and layouts

| Field | Value |
|---|---|
| Feature ID | F0-15 |
| Dashboard / stream | Shared |
| Phase | Phase 0 — Foundation & shared UI kit |
| Development branch (PR target) | `main (per OQ-01 — shared work)` |
| Feature branch | `feature/shared-app-shell` |
| Documentation | `docs/development/shared/shared-app-shell/` |
| Lane | S — Shared kit |
| Sprint | SPRINT · planned D3 |
| Status / owner | See PROGRESS.md |

> **Plan v0.2:** built before authentication so screens can start on Day 4; F0-07 adds real guards.

## Purpose
Provide the navigation frame every screen sits in.

## Problem
Roles need different navigation; the client's identity must anchor Family pages, not the logged-in user (D16).

## Description
Implements the persistent chrome for the Family, Carer and Admin dashboards exactly as shown in the Figma screens.

## User value
Three distinct, recognisable portals; users always know whose record they are viewing.

## Users
- Family
- Carer
- Admin

## Scope
- Rail (88px, vertical gradient #07727D→#0C9BA9) with role label at top (FAMILY / CARER / ADMIN) and icon+label items; active item is a surface tile with brand text.
- Family items: Home · Info · Calendar · Budget · Settings. Carer: Home · Patients · Calendar · Settings. Admin: Home · Manage · Staff · Clients · Settings.
- Nav items in the top ~43% of the rail; nothing bottom-anchored.
- Header 76px: Family → client avatar (46) + name (Title/Page) + subline '78 years · Preston VIC · Banksia Home Care'; Carer/Admin → screen name. Right side: current date ('Monday 30 November 2026'), divider, [Carer only: bell], user avatar + first name.
- Top-bar placement of sign-out (UI-§5.1 says log-out/help in the top bar; exact control not drawn — PROPOSED user menu on avatar).
- Role layouts in `(family)/family/[clientId]`, `(carer)/carer`, `(admin)/admin`; active item derived from route.
- Bell renders only in the Carer header (panel behaviour in CAR-02).
- Signed-in user comes from the `getCurrentUser()` contract (UI-00): mock session until F0-07 swaps in Supabase Auth; role layouts are unguarded mock routes until F0-07.

## Out of Scope
- Screen content
- Notifications panel behaviour (CAR-02)
- Help/FAQ (OQ-25, parked)
- Rail collapse (not designed)

## Functional Requirements
- Rail links navigate within the role only.
- Header client subline shows age computed from date of birth, suburb and current organisation name.

## UI / UX Requirements
- Match Figma screens; tabular numerals in date.

## Dependencies
- Features: F0-14 (Core UI primitives and state components), UI-00 (Domain types, data-access contracts and design fixtures)
- Blocking open decisions (must be answered before START FEATURE): OQ-01
- Non-blocking open decisions (proposed defaults apply, confirm when possible): OQ-14, OQ-25

## Inputs
- Session profile
- Client (family routes)

## Outputs
- Layouts

## Error / Edge Cases
- Client with no organisation (after removal) → subline omits organisation (PROPOSED).

## Security / Permissions
- Layout fetches only the signed-in user's own profile and an authorised client.

## Technical Considerations
- Server Components for layouts; `usePathname` only inside a small client component for active state.

## Traceability
- Product requirements: REQ-02 (Three separate role dashboards — Family, Carer, Admin — each with its own navigation; cont…), REQ-12 (The client's name and avatar anchor Family page headers; the signed-in user is shown separ…), REQ-N1 (Usable by non-technical users aged 55–80 and carers on shared laptops; plain language; des…), REQ-N2 (WCAG 2.1 AA: 4.5:1 text contrast, 44×44px targets, visible focus, status not by colour alo…)
- Sources: UI-§4 rail contents; UI-D15, D16, D34, D35; UI-§5.1 rail gradient rules; Design: all dashboard screens
- Source abbreviations are defined in `docs/SOURCES.md`.

## Labels
Statements marked PROPOSED are implementation proposals, not confirmed requirements. Anything affected by an open decision is listed under Dependencies and must not be finalised until DECISIONS.md records the answer.
