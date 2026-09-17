# Sprint Plan — Care Compass (2 weeks, parallel lanes)

Plan v0.2 · 17 September 2026. Day numbers are working days (D1–D14 across two calendar weeks; D13–D14 are buffer).
Feature detail: `DEVELOPMENT_PLAN.md`. Live status: `node scripts/plan-status.mjs`.

---

## 1. Shape of the sprint

```
Day        1    2    3    4    5    6    7    8    9    10   11   12   13   14
Lane S   [tooling·tokens·primitives·contracts·shell·kits]
Lane B        [supabase·recurrence·schema/RLS·auth·events·shifts·budget·docs·seed]
Lane F                  [ Family screens on fixtures ]  [ Family wiring        ]
Lane C                  [ Carer screens on fixtures  ]  [ Carer wiring ]
Lane A                  [ Admin screens on fixtures  ]  [ Admin wiring ]
Lane I                                                             [e2e·fixes·release][buffer]
Checkpoints                                  ▲ D7 prototype        ▲ D10        ▲ D12 RC
```

Why this shape:
- **UI kit first (D1–D4):** tokens, primitives, data contracts + fixtures, app shell, calendar/forms/lists kits. Without it, three dashboards would each build their own versions.
- **Screens in parallel (D4–D7):** every designed screen is built on fixtures by three lanes at once. Screens have **no blocking decisions** — they follow the design.
- **Backend in parallel (D2–D7):** the longest, riskiest work starts on D2, not after the UI.
- **Wiring in parallel (D8–D11):** each lane swaps fixtures for real data through the same contract functions.
- **Integration last (D11–D13):** cross-role journeys, fixes, release candidate.

---

## 2. Lanes and staffing

| Lane | Owns | Features (sprint) | Suggested people |
|---|---|---|---|
| S — Shared kit | Phase 0 | F0-01, F0-02, F0-05, F0-03, F0-14, UI-00, F0-15, UI-01, UI-02, UI-03 | 1 (from D4 joins F/C/A or I) |
| B — Backend | Phase 2 (+ INT-01 stretch) | F0-04, F0-09, F0-06, F0-08, F0-10, F0-07, F0-11, F0-12, F0-13, F0-16 | 1–2 |
| F — Family | FAM-UI-01…07, FAM wiring | 7 screens + 14 wiring features | 1–2 |
| C — Carer | CAR-UI-01…04, CAR wiring | 4 screens + 7 wiring features | 1 |
| A — Admin | ADM-UI-01…05, ADM wiring | 5 screens + 6 wiring features | 1 |
| I — Integration | INT-02, INT-03, INT-04 (+ INT-05, INT-08 stretch) | 3 (+2) | whoever frees up first (usually S) |

Team of 5: S, B, F, C, A — S moves to I on D8. Team of 3: (S→F), (B), (C+A). Team of 2: (S→F→C), (B→A). A lane owner can run several Claude Code sessions via git worktrees, but **usage limits are per account**: parallel sessions on one Pro account drain it faster, they don't add capacity. Plan roughly 2 heavy Claude Code usage windows per person per day on Pro.

Record assignments here:

| Lane | Owner(s) | Worktree path |
|---|---|---|
| S | | |
| B | | |
| F | | |
| C | | |
| A | | |
| I | | |

---

## 3. Day by day

| Day | S — Shared | B — Backend | F — Family | C — Carer | A — Admin | Human / team |
|---|---|---|---|---|---|---|
| D1 | F0-01 validation, F0-02 tooling (+ create dev branches), F0-05 tokens | Install Docker + Supabase CLI | Export missing screens; read designs | Read designs | Read designs | Pack merged; answer OQ-01, OQ-20; review validation report; start working through decisions |
| D2 | F0-03 CI, F0-14 primitives + icons, UI-00 contracts + fixtures | F0-04 Supabase env, F0-09 recurrence (pure logic) | — | — | — | Branch protection on; Jira import |
| D3 | F0-15 app shell, UI-01 calendar kit, UI-03 lists/cards kit, UI-02 forms kit (start) | F0-09 finish, F0-06 access schema + RLS | — | — | — | Daily sync `main` → dev branches |
| D4 | UI-02 finish | F0-06 finish, F0-08 audit, F0-10 shifts | FAM-UI-01 Home, FAM-UI-02 Calendar | CAR-UI-01 Home, CAR-UI-02 Patients | ADM-UI-01 Home, ADM-UI-02 Manage | Daily sync |
| D5 | → helps F | F0-10 finish, F0-07 auth, F0-11 events (start) | FAM-UI-02 finish, FAM-UI-03 event form, FAM-UI-04 Info | CAR-UI-02 finish, CAR-UI-03 Calendar | ADM-UI-02 finish, ADM-UI-03 Staff | Daily sync |
| D6 | → helps F / C / A | F0-11 finish, F0-12 budget, F0-13 documents (start) | FAM-UI-05 Budget, FAM-UI-06 Settings, FAM-UI-07 Task log/detail | CAR-UI-03 finish, CAR-UI-04 Settings | ADM-UI-03 finish, ADM-UI-04 Clients, ADM-UI-05 Settings | Daily sync |
| D7 | Review screens vs designs | F0-13 finish, F0-16 seed data | FAM-UI-07 finish; polish | Polish | Polish | **Checkpoint 1:** dev branches → `main` (clickable prototype on fixtures); demo to client if useful |
| D8 | → Lane I prep | Support wiring; fix contract/schema gaps | FAM-01, FAM-02, FAM-03, FAM-04 | CAR-01, CAR-03 | ADM-01, ADM-02 | Daily sync |
| D9 | I: write e2e specs against fixtures | Support wiring | FAM-04 finish, FAM-05, FAM-06, FAM-09 | CAR-02, CAR-04, CAR-05 | ADM-02 finish, ADM-04, ADM-06 | Daily sync |
| D10 | I | Support | FAM-07, FAM-08, FAM-10, FAM-12 | CAR-05 finish, CAR-06, CAR-09 | ADM-07, ADM-10 | **Checkpoint 2:** dev branches → `main` |
| D11 | I | INT-01 budget emails (stretch) | FAM-13, FAM-14, FAM-15 | Fixes | Fixes | Daily sync |
| D12 | INT-02, INT-03, INT-04 journeys | INT-01 (stretch) | Fixes from e2e | Fixes | Fixes | **Checkpoint 3:** release candidate → `main` |
| D13 | INT-05 access matrix / INT-08 handover (stretch) | Fixes | Fixes | Fixes | Fixes | Demo prep |
| D14 | Buffer | Buffer | Buffer | Buffer | Buffer | Submission / demo |

A feature only starts when `plan-status` says it is ready. If a lane is waiting (dependency or open decision), pull the next ready feature in that lane, help another lane's screens, or write tests for the next feature.

---

## 4. Decisions and when they start blocking work

Open decisions remain open until the human closes them in DECISIONS.md. Screens (Phase 1) are **not** blocked by any decision. This table shows the first planned day each open blocking decision stops sprint work:

| Needed by | Decision | Blocks (sprint) |
|---|---|---|
| D1 | OQ-01 Branching for shared work | All shared features (Phase 0, Phase 2, shared INT) |
| D1 | OQ-20 Repository/infrastructure reality | F0-01 |
| D2 | OQ-12 Recurrence options | F0-09, FAM-06 |
| D3 | OQ-07 Client creation & family linking | F0-06, ADM-04 |
| D3 | OQ-09 Carer access model | F0-06, F0-10, F0-11, CAR-01, CAR-03, CAR-04, CAR-06, ADM-07, INT-04 |
| D3 | OQ-16 Family role granularity | F0-06 |
| D5 | OQ-08 Sign-in, invites, MFA | F0-07, ADM-02, ADM-04 |
| D5 | OQ-10 Status behaviour & undo | F0-11, FAM-05, FAM-06, FAM-07, FAM-15, CAR-06 |
| D5 | OQ-22 Event fields | F0-11, FAM-06, FAM-07 |
| D5 | OQ-29 Nurse shown on an event | F0-11, FAM-01, FAM-14, FAM-15, ADM-01 |
| D5 | OQ-33 Carer calendar semantics | F0-11, CAR-01, CAR-05, CAR-06, INT-03, INT-04 |
| D6 | OQ-03 Budget thresholds | F0-12, FAM-03, INT-01 |
| D6 | OQ-04 Funding model | F0-12, FAM-03, FAM-10 |
| D6 | OQ-05 Fund editing & expenses | F0-12, FAM-10 |
| D6 | OQ-26 File upload limits | F0-13, FAM-08, FAM-09 |
| D8 | OQ-13 Staff names & job titles | ADM-02 |
| D9 | OQ-14 Carer notifications | CAR-02 |
| D10 | OQ-11 Recurring edit scope | FAM-07 |
| D10 | OQ-35 Settings save behaviour | FAM-12, CAR-09, ADM-10 |
| D11 | OQ-06 Organisation change model | FAM-13, INT-02 |
| D11 | OQ-15 History visibility after transfer | FAM-13, INT-02 |
| D11 | OQ-17 Hosting, email, scheduler | INT-01, INT-08 |
| D11 | OQ-28 Budget email recipients | INT-01 |

The critical path runs through **OQ-09, OQ-10, OQ-22, OQ-29, OQ-33** (events and carer access, needed D3–D5) and **OQ-03/04/05** (budget, D6). If these are still open on their day, lane B switches to unblocked backend work and the affected wiring features slip.

---

## 5. Daily rhythm (15 minutes)
1. Each person runs `node scripts/plan-status.mjs --lane <X>` and picks/continues a ready feature.
2. Lane owners merge the `main` → `<dashboard>-dev` sync PR.
3. Blockers raised: open decisions to the human, shared component requests to lane S, contract/schema gaps to lane B.
4. End of day: every active feature has updated PROGRESS.md/SESSION_STATE.md pushed; reviewers merge ready PRs; someone runs `node scripts/plan-status.mjs --write` on `main`.

---

## 6. Post-sprint and stretch
- **Stretch (if time):** INT-01 budget threshold emails, INT-05 access-control matrix, INT-08 release & handover pack.
- **Post-sprint (need design or decisions):** FAM-11 Update funds, CAR-07 carer add/edit events, CAR-08 record expense, ADM-03 deactivate staff, ADM-05 remove client, ADM-08 carer assignments, ADM-09 edit/extend shift, INT-06 accessibility verification, INT-07 performance verification.

---

## 7. Capacity reality check
The sprint holds 66 features plus 3 stretch. Screens take roughly half a day to a day each once the kit exists. Backend features take one to two usage windows each. The plan fits about 5 people working in parallel for 10–12 days, each running Claude Code on their own account. With fewer people, keep the order but cut from the end of each lane: wiring for Settings screens first, then Task log/detail, then Carer notifications. The D7 checkpoint (every screen clickable on fixtures) and core Family wiring are the minimum worth protecting.
