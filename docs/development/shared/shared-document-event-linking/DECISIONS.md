# Decisions — F0-23 Link uploaded documents to a new event

## Open decisions affecting this feature
None.

## Feature decisions log
- FD-01 (2026-10-02, human-chosen in CHG-045): option (a), a guarded `SECURITY DEFINER` function, over staging files in the browser. The function checks client access, the uploader, the event's client and that the document is unlinked and attached, because it bypasses RLS.
- FD-02 (2026-10-02, non-blocking default, human may override): if linking fails after `createEvent` succeeds, the event is kept and the user is told which files did not attach. Rolling the event back is not possible from the client and would hide a saved event.
- FD-03 (2026-10-02, non-blocking default): the uploader guard (`uploaded_by = auth.uid()`) means one family member cannot link a file another family member uploaded. Chosen because Add event only ever links the caller's own fresh uploads; it can be relaxed later without a table change.
- FD-04 (2026-10-02): no `documents` grant or policy changes. Direct `update (event_id)` is not granted, so the function is the only way to set it.
- FD-05 (2026-10-02, non-blocking default, human may override): on a partial link failure the form stays with an alert naming the files and a Continue link to the return page, and the Save button is removed. Redirecting at once would hide the failure; keeping Save would let a second click create a duplicate event.
- FD-06 (2026-10-02): ids are validated with `z.guid()` (as F0-22 FD-07), because seed event ids carry no RFC version bits.

## Test changes
None yet.
