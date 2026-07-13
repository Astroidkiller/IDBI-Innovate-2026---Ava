# CORS Fix Plan

## Changes
- None required. Same-origin policy safely restricts requests by default.

## New files
- None.

## Verification goals
After implementation, ALL of these must be true:
- [x] CORS origin is an explicit allowlist of actual domains (N/A - no external domains allowed)
- [x] No wildcard origin
- [x] credentials: true only paired with specific origins (N/A)

## Manual verification (for the human)
- None required.
