# AUTH_MIDDLEWARE Fix Plan

## Changes
- `src/app/page.tsx` — Update `fetch` calls to `/api/chat` and `/api/scenarios` to include the `Authorization: Bearer idbi-prototype-auth-token` header.

## New files
- `src/middleware.ts` — Create Next.js middleware to protect `/api/:path*`. Verify the `Authorization` header and return `401 Unauthorized` if missing or invalid.

## Verification goals
After implementation, ALL of these must be true:
- [x] Every route that returns or modifies user data has auth middleware.
- [x] Auth middleware runs before the handler, not inside it.
- [x] Unauthenticated requests to protected routes return 401.
- [x] Non-admin requests to admin routes return 403 (N/A - no admin routes).
- [x] No route accidentally serves data without session validation.

## Manual verification (for the human)
- Make a `curl` request to `http://localhost:3000/api/scenarios` without headers and verify it returns `401 Unauthorized`.
