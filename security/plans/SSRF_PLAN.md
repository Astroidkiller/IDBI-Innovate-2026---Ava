# SSRF Fix Plan

## Changes
- None required. The application does not perform user-supplied URL fetching.

## New files
- None.

## Verification goals
After implementation, ALL of these must be true:
- [x] All user-supplied URL fetching validates the URL before requesting (N/A)
- [x] Private IP ranges are blocked (N/A)
- [x] Only http and https schemes are allowed (N/A)
- [x] Hostname is resolved and IP checked before the request is made (N/A)

## Manual verification (for the human)
- None required.
