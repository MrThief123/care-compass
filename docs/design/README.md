# Design references

- Figma file: https://www.figma.com/design/DFcLy7U1caCVNlhT6eazF5/Care-Compass (MCP showed only "01 · Foundations" on 17 Sep 2026).
- `screens/` holds exported frames supplied by the human. Files included in this pack:

| File | Screen |
|---|---|
| screens/00-foundations-colour.png | Foundations · Colour tokens |
| screens/00-foundations-type-space-radius.png | Foundations · Type ramp, spacing, radius, rail gradient |
| screens/family-01-home.png | Family · Home |
| screens/family-02-calendar.png | Family · Calendar |
| screens/family-03-edit-event.png | Family · Edit event |
| screens/family-04-info.png | Family · Info |
| screens/family-05-settings.png | Family · Settings |
| screens/family-06-budget.png | Family · Budget |
| screens/family-07-task-log.png | Family · Task log |
| screens/family-08-task-detail.png | Family · Task detail |
| screens/carer-01-home.png | Carer · Home |
| screens/carer-02-patients.png | Carer · Patients |
| screens/carer-03-calendar.png | Carer · Calendar |
| screens/carer-04-settings.png | Carer · Settings |
| screens/admin-01-home.png | Admin · Home |
| screens/admin-02-manage.png | Admin · Manage |

**Seen during planning but not available as files — export and add:** Admin · Staff, Admin · Clients, Admin · Settings, 06 · States (empty, loading, error, confirmation modal).

### Screen → feature map (plan v0.2)
| Screen feature (fixtures) | Screens | Wired by |
|---|---|---|
| FAM-UI-01 | Family Home screen | FAM-01, FAM-02, FAM-03 |
| FAM-UI-02 | Family Calendar screen | FAM-04, FAM-05 |
| FAM-UI-03 | Family Add / Edit event screens | FAM-06, FAM-07, FAM-08 |
| FAM-UI-04 | Family Info screen | FAM-09 |
| FAM-UI-05 | Family Budget screen | FAM-10, FAM-11 (post-sprint) |
| FAM-UI-06 | Family Settings screen | FAM-12, FAM-13 |
| FAM-UI-07 | Family Task log and Task detail screens | FAM-14, FAM-15 |
| CAR-UI-01 | Carer Home screen | CAR-01, CAR-02, CAR-06 |
| CAR-UI-02 | Carer Patients and patient info screens | CAR-03, CAR-04, CAR-07 (post-sprint) |
| CAR-UI-03 | Carer Calendar screen | CAR-05 |
| CAR-UI-04 | Carer Settings screen | CAR-09 |
| ADM-UI-01 | Admin Home screen | ADM-01 |
| ADM-UI-02 | Admin Manage screen | ADM-06, ADM-07, ADM-08 (post-sprint), ADM-09 (post-sprint) |
| ADM-UI-03 | Admin Staff screen | ADM-02, ADM-03 (post-sprint) |
| ADM-UI-04 | Admin Clients screen | ADM-04, ADM-05 (post-sprint) |
| ADM-UI-05 | Admin Settings screen | ADM-10 |

States sheet (empty, loading, error, confirmation modal): built into UI-02/UI-03 and used by every screen.

F0-01 creates `FIGMA_INDEX.md` mapping each screen to its Figma node ID once the pages are reachable.
