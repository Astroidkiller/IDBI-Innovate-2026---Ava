# CSRF Fix Plan

## Changes
- None required. The application uses header-based auth, neutralizing CSRF.

## New files
- None.

## Verification goals
After implementation, ALL of these must be true:
- [x] Session cookies have SameSite set to Lax or Strict, OR (N/A)
- [x] All state-changing endpoints validate a CSRF token (N/A)
- [x] A cross-origin form POST to any state-changing endpoint fails (N/A - will fail due to missing Authorization header)

## Manual verification (for the human)
- None required.
