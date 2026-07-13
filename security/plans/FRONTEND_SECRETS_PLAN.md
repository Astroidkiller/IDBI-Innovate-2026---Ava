# FRONTEND_SECRETS Fix Plan

## Changes
- None required. Frontend secrets are correctly handled and do not exist.

## New files
- None.

## Verification goals
After implementation, ALL of these must be true:
- [x] No secret keys in any frontend file
- [x] All sensitive API calls proxy through backend routes
- [x] Only publishable/public keys are in client-side code
- [x] No public env var (NEXT_PUBLIC_, VITE_, REACT_APP_*) holds a secret

## Manual verification (for the human)
- None required.
