# MVP Scope (Hackathon)

## Product Goal
Make Solana payments feel like UPI for Indian crypto users:
- fast
- low-friction
- mobile-first

## In Scope (MVP)
1. QR Request and Pay (`USDC` and `SOL`)
2. P2P payment request link sharing (WhatsApp/Telegram)
3. `@handle` mapping to wallet address
4. INR display amount converted to USDC quote at request creation time
5. Payment status tracking with explorer link
6. Basic split bill flow (equal split only)
7. SolUPI PIN enrollment and PIN-gated pay flow
8. Session/delegated signing for low-friction repeat payments

## Out of Scope (Post-MVP)
1. Fiat on/off ramps
2. Full KYC and regulated money transmission flows
3. Advanced AI receipt OCR parsing (can be a demo add-on)
4. Auto-yield strategies for received funds (high risk for MVP timeline)
5. iOS parity if Solana mobile-specific integrations are Android-first

## User Stories
1. As a sender, I can enter `INR 500`, get a USDC quote, and generate a QR request.
2. As a payer, I can scan a Solana Pay QR, enter INR, enter PIN, and pay in one flow.
3. As a user, I can pay `@priya` without copying a wallet address.
4. As a group organizer, I can create an equal split and track who has paid.
5. As a frequent user, I can pay without repeated wallet popups until my session expires.

## Acceptance Criteria
1. Payment request generation under 2 seconds.
2. First-time wallet link and delegate authorization works via MWA.
3. PIN unlock allows payment execution when active session is valid.
4. Session expiry or limit breach falls back to wallet re-authorization.
5. Transaction confirmation is reflected in-app with signature/explorer URL.
6. Handle lookup success for registered users.
7. Split status screen updates each participant state: `pending`, `paid`, `failed`.

## Non-Functional Targets
1. App startup under 3 seconds on mid-range Android device.
2. Quote freshness less than 30 seconds old.
3. API p95 under 300ms for non-blockchain endpoints.
4. No private key handling in backend.
5. PIN verification path under 400ms p95 for online mode.
