# RATE_LIMITING Fix Plan

## Changes
- `src/middleware.ts` — Update the middleware to track requests by IP using a sliding or fixed window (in-memory Map for the prototype).
- If requests exceed 20 per minute, block and return `429 Too Many Requests`.

## New files
- None.

## Verification goals
After implementation, ALL of these must be true:
- [x] Expensive AI endpoints have rate limiting active.
- [x] Rate limit triggers after N attempts (20 per minute).
- [x] Rate-limited requests return 429.

## Manual verification (for the human)
- None required (can be tested by rapidly spamming the chat button 20+ times).
