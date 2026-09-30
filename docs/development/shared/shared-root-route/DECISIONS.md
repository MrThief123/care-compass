# Decisions — F0-19 Root route and production guard for dev previews

## Open decisions affecting this feature
None.

## Feature decisions log
- FD-01 (2026-09-30): showcase path `/dev-preview` (matches the existing `dev-preview-*` names). Guard is 404 in production rather than deleting the pages, so local UI-kit work is unaffected. Non-blocking; confirm at START FEATURE.
