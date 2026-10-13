# Acceptance criteria — F0-27 Delete event
- AC-01 The edit screen shows a Delete event button to anyone who may edit; absent otherwise.
- AC-02 Delete asks for confirmation; Cancel changes nothing.
- AC-03 A one-off event deletes with a single confirm and disappears from the calendar.
- AC-04 A recurring event offers "Delete this event" and "Delete all future events".
- AC-05 "This event" removes only the viewed occurrence; the rest of the series stays.
- AC-06 "All future" removes the viewed and later occurrences; earlier occurrences, ticks and charged costs stay.
- AC-07 "All future" on the first occurrence removes the whole series.
- AC-08 A failure shows "Couldn't delete. Please try again." and the event stays.
- AC-09 After a delete the user returns to where they came from and cached pages are refreshed.
