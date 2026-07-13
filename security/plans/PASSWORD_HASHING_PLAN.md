# PASSWORD_HASHING Fix Plan

## Changes
- None required. No passwords are comprehensively managed or stored in this application.

## New files
- None.

## Verification goals
After implementation, ALL of these must be true:
- [x] Passwords hashed with bcrypt, Argon2, or scrypt only (N/A)
- [x] No MD5, SHA-1, or SHA-256 used for passwords (N/A)
- [x] Existing weak hashes migrated or users forced to reset (N/A)

## Manual verification (for the human)
- None required.
