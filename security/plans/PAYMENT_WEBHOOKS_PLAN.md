# PAYMENT_WEBHOOKS Fix Plan

## Changes
- None required. No payment integrations exist.

## New files
- None.

## Verification goals
After implementation, ALL of these must be true:
- [x] stripe.Webhook.construct_event validates signature on every request (N/A)
- [x] Invalid or missing signatures return 400 (N/A)
- [x] Processed event IDs are stored and duplicates are skipped (N/A)
- [x] Handlers exist for required failure and success events (N/A)

## Manual verification (for the human)
- None required.
