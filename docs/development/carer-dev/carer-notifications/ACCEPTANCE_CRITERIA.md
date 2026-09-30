# Acceptance Criteria — CAR-02 Carer — Notifications card and bell

Rewritten 2026-09-30 (12 criteria) for CHG-025 and FD-01 to FD-06; the original four (Family document trigger, permission, card) are superseded. Each criterion maps to at least one test in TEST_PLAN.md. Criteria may not be changed after implementation starts without a controlled change recorded in DECISIONS.md.

| ID | Story | Type | Criterion (Given / When / Then) | Status |
|---|---|---|---|---|
| AC-01 | US-01 | happy | Given Priya assigns Aisha a shift on Tue 1 Dec 2026 09:00–11:00 (Melbourne) for Margaret Doyle, when the insert commits, then Aisha has an unread notification with source 'admin', kind 'shift_assigned' and message 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret Doyle).'. | MET |
| AC-02 | US-01 | happy | Given Aisha's shift, when its times change to Wed 2 Dec 13:00–17:00, then she gets 'Shift changed: Wednesday 2 Dec now 13:00–17:00 (Margaret Doyle).'; and an update that changes neither times, carer nor cancellation notifies nobody. | MET |
| AC-03 | US-01 | happy | Given Aisha's shift on Fri 4 Dec 08:00–12:00, when it is cancelled, then she gets 'Shift cancelled: Friday 4 Dec, 08:00–12:00 (Margaret Doyle).' exactly once, and later updates to that shift notify nobody. | MET |
| AC-04 | US-01 | happy | Given Aisha's shift, when Priya reassigns it to Daniel, then Aisha gets a 'shift_cancelled' notification and Daniel a 'shift_assigned' one. | MET |
| AC-05 | US-01 | permission | Given Daniel, when he selects notifications, then Aisha's are not returned; and he cannot insert one, cannot change a message, and cannot mark Aisha's read. | MET |
| AC-06 | US-01 | happy | Given three notifications (one read, two unread), when the Notifications card renders, then rows show the source chip and message newest first, unread rows carry an 'Unread' marker and the read row does not. | MET |
| AC-07 | US-01 | happy | Given two unread notifications, when the header renders, then the bell's accessible name is 'Notifications, 2 unread' with a visible count '2'; with none unread the name is 'Notifications' and no count shows; ten or more shows '9+'. | MET |
| AC-08 | US-01 | happy | Given two unread on Carer Home, when Aisha clicks the bell, then the Notifications card scrolls into view and takes focus, all her notifications are marked read, the count disappears and the unread markers go. | MET |
| AC-09 | US-01 | happy | Given Aisha is on another carer page (for example Patients), when she clicks the bell, then she lands on `/carer/home#carer-home-notifications` and the notifications are marked read. | MET |
| AC-10 | US-01 | happy | Given Aisha's notifications in the database, when `getCarerNotifications` and `getCarerUnreadCount` run as Aisha, then they return her rows newest first (at most 50, `read` from `read_at`) and her unread count; `markCarerNotificationsRead` marks only her rows. | MET |
| AC-11 | US-01 | error | Given `markCarerNotificationsRead` fails, when Aisha clicks the bell, then the card still scrolls, the count stays, and no error text carries client or carer names. | MET |
| AC-12 | US-01 | a11y | Given the header and the Carer Home card, when axe runs and the page is used by keyboard, then no violations; the bell is reachable and activates with Enter and Space; 44×44px target. | MET |

Status values: NOT MET · MET (test passing) · BLOCKED (cite OQ/PD).
