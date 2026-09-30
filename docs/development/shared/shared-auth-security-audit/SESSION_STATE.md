# Session State — F0-21 Auth security audit

Last session date: 2026-10-01
Current branch: none (feature not started)
Worked on: feature created by CHG-041 (docs only)
Important discoveries (from F0-20): no RLS policy checks `aal`; sign-in form can submit as a GET with credentials in the URL before hydration; cookie flags and rate limits unverified.
Exact next action: wait for F0-20 to merge, then claim the branch.
