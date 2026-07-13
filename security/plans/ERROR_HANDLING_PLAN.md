# ERROR_HANDLING Fix Plan

## Changes
- None required. API routes already safely catch and sanitize errors.

## New files
- None.

## Verification goals
After implementation, ALL of these must be true:
- [x] Global error handler catches all unhandled exceptions (Handled by Next.js App Router)
- [x] Client responses contain only generic error messages
- [x] Full error details logged server-side only
- [x] No stack traces, SQL errors, or file paths in any API response
- [x] Debug/development mode is off in production config (Next.js default behavior)

## Manual verification (for the human)
- None required.
