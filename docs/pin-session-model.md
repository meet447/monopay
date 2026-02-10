# PIN + Session Model

## Objective
Provide UPI-like checkout:
1. scan
2. enter amount in INR
3. enter PIN
4. payment executes

without forcing wallet popup confirmation for every transaction.

## Model
1. User links wallet via MWA.
2. User performs one-time delegate/session authorization.
3. App enrolls a 4-6 digit SolUPI PIN.
4. PIN unlocks session-backed payment execution until limits/expiry are hit.

## Session Guardrails
1. Per transaction limit (example: `<= 1000 INR` equivalent)
2. Daily cumulative limit (example: `<= 5000 INR`)
3. Session expiry (example: 24 hours)
4. Device binding (session only valid for enrolled device)

If any guardrail fails, fallback to wallet re-authorization.

## PIN Handling
1. PIN is never stored in plaintext.
2. Store only `argon2id` hash + salt (server) and secure-key material (device keystore).
3. Track failed attempts and temporary lockout.
4. Add optional remote session revoke on suspected compromise.

## Execution Modes
1. `session_fast_path`: PIN + active session -> delegated signature path
2. `wallet_fallback_path`: PIN accepted but session invalid -> MWA authorization required

## UX Behavior
1. User should always get deterministic feedback: `paid`, `pending`, `failed`.
2. If quote expires before payment, app must refresh quote and show updated USDC.
3. If session expires during pay, app transitions to wallet fallback with clear reason.

## Compliance Note
This is a crypto payment UX abstraction, not a fiat UPI rail. Keep wording clear in product messaging.
