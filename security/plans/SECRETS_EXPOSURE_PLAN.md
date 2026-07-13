# SECRETS_EXPOSURE Fix Plan

## Changes
- `.env.example` — create file with placeholder `GEMINI_API_KEY="your_api_key_here"`

## New files
- `.env.example`

## Verification goals
After implementation, ALL of these must be true:
- [x] `git ls-files .env` returns nothing
- [x] `grep -rn` for secret patterns across all source files returns nothing
- [x] No env var prefixed with `NEXT_PUBLIC_`, `VITE_`, or `REACT_APP_` contains a secret key
- [x] `.env.example` exists with placeholder values only

## Manual verification (for the human)
- Check that `.env.local` is ignored by your IDE's git tracking.
