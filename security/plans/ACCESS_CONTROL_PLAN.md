# ACCESS_CONTROL Fix Plan

## Changes
- None required. There are no endpoints taking a resource ID.

## New files
- None.

## Verification goals
After implementation, ALL of these must be true:
- [x] Every route with a resource ID parameter checks current_user.id == resource.owner_id (N/A)
- [x] This check exists on GET, PUT, PATCH, and DELETE operations (N/A)
- [x] Failing the ownership check returns 403 (N/A)
- [x] Auth and ownership are separate checks (N/A)

## Manual verification (for the human)
- None required.
