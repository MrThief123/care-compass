# Acceptance Criteria — FAM-UI-03 Family Add / Edit event screens (UI)

Each criterion is observable and maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given the Physiotherapy fixture, when Edit event renders, then Date 'Monday 30 November 2026', Recurring 'Weekly', Status Planned and the description text are shown. | MET |
| AC-02 | US-01 | validation | Given the Add event form with no date, when Save event is pressed, then a Date error is shown. | MET |
| AC-03 | US-01 | happy | Given Edit event, when rendered, then document tiles 'Physio referral.pdf' and 'Exercise plan.pdf' and an 'Add file' tile are shown. | MET |
| AC-04 | US-01 | happy | Given Family Home, when 'Enter event' is clicked, then the Add event screen opens. | MET |
| AC-05 | US-01 | happy | Given the Add event form, when it renders, then the switch 'This is a task — must be ticked off' is On, and pressing it turns it Off and back On (local state only). Added by CHG-009. | MET |
| AC-06 | US-01 | happy | Given Edit event, when it renders, then the task switch shows the event's current value: On for Physiotherapy (a task), Off for Afternoon walk (a plain event). Added by CHG-009. | MET |
| AC-07 | US-01 | happy | Added by CHG-015. Given Task detail for an occurrence, when 'Edit event' is pressed, then Edit event opens on that occurrence (its date and status), and the link carries the occurrence key and Task detail's own origin (`from=` plus that screen's params, CHG-014). | MET |
| AC-08 | US-01 | happy / validation | Added by CHG-015. Given Edit event, including after a reload or from a shared link, when Save event (valid) or Cancel is pressed, then it goes to that occurrence's Task detail with the origin kept, so Task detail's Back still reaches the screen it was first opened from. With a missing, unknown or other event's occurrence it goes to the origin screen itself, and with no origin to the Task log. A hostile `from` is treated as no origin. The href is built only from whitelisted, re-validated values; `router.back()` is not used. | MET |
| AC-09 | US-01 | happy | Added by CHG-015. Given Add event, including opened directly, when Save event (valid) or Cancel is pressed, then it goes to Family Home (its only opener); `router.back()` is not used. | MET |
| AC-10 | US-01 | happy / validation | Added by CHG-017. Given Add event opened from the Calendar (`from=calendar` with `view / date / month`), when Save event (valid) or Cancel is pressed, then it goes to that Calendar view. The Calendar params are re-validated by the Calendar's parser (bad values fall back to their defaults); any other or hostile `from` goes to Home as in AC-09. | NOT MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
