# Architecture

## High-Level Components
1. React Native app
2. Solana RPC + indexing provider
3. Optional Rust gateway (`axum`)
4. Anchor program for split state and settlement rules
5. Session/delegated signer layer for PIN-authorized fast checkout

## Why Optional Gateway
Gateway is required if you want:
1. `@handle` registry
2. INR to USDC quote service
3. Notification orchestration (SMS/WhatsApp)
4. Centralized payment request IDs and status polling

Gateway is not required for:
1. pure wallet-to-wallet Solana Pay URI generation
2. direct MWA transaction signing

## Mobile App Responsibilities
1. Wallet connect and sign using MWA
2. PIN enrollment and PIN verification UI
3. Build and render Solana Pay QR
4. Scan QR and execute pay flow
5. Manage local delegated-session state and wallet preferences
6. Show payment timeline and split progress

Suggested app modules:
1. `wallet/`: MWA adapters, account state
2. `pin/`: PIN setup, lock/unlock state, retry/backoff
3. `session/`: delegated signer session lifecycle
4. `payments/`: request/pay, QR encode/decode
5. `contacts/`: handle search and favorites
6. `splits/`: create split, approvals, status
7. `notifications/`: in-app push/sms state

## Rust Gateway Responsibilities
1. Handle registry API (`@name -> pubkey`)
2. Quote API (`INR -> USDC`, with source timestamp)
3. Session issuance policy (limits, expiry, device binding)
4. Payment intent creation and short-link lookup
5. Split coordination metadata storage
6. Webhook ingestion from indexer and tx status updates

Suggested service boundaries:
1. `auth`: wallet-signature nonce challenge
2. `users`: profile + handle + linked wallets
3. `pin`: PIN enrollment record + verification state
4. `sessions`: delegated authorization policies
5. `payments`: intent lifecycle
6. `splits`: participant coordination
7. `quotes`: market data adapter
8. `events`: on-chain tx reconciliation

## On-Chain Design (Anchor)
MVP program accounts:
1. `SplitAccount`
2. `SplitParticipant`
3. `DelegationAccount` (optional for spend-limit enforcement)

Instructions:
1. `create_split`
2. `join_split`
3. `settle_split_share`
4. `close_split`
5. `authorize_delegate` (if on-chain delegation route is used)

For MVP, use off-chain coordination + on-chain settlement receipts.

## Data Model (Gateway)
1. `users(id, handle, created_at)`
2. `wallet_links(user_id, pubkey, chain, is_primary)`
3. `pin_profiles(user_id, pin_hash, failed_attempts, locked_until)`
4. `payment_sessions(id, user_id, wallet_pubkey, per_tx_limit, daily_limit, expires_at, status)`
5. `payment_intents(id, creator_user_id, token, amount, memo, status, ref)`
6. `payment_events(id, payment_intent_id, signature, status, confirmed_at)`
7. `splits(id, owner_user_id, token, total_amount, status)`
8. `split_members(split_id, user_id, share_amount, state)`

## Security Baseline
1. Wallet-signature auth (no password auth)
2. Nonce-based challenge with expiry
3. PIN hashing with strong KDF (`argon2id`) and per-user salt
4. Session token binding to wallet + device fingerprint
5. Idempotency keys for create payment/split endpoints
6. Strict input validation for handle, memo, amount
7. Rate limits for quote and request creation APIs
8. Hard fallback to wallet re-authorization after lockout/expiry

## Suggested Infra
1. PostgreSQL for durable state
2. Redis for nonce + short-lived cache
3. Helius/Triton/WebSocket indexer for signature updates
4. Sentry + OpenTelemetry for traces and errors

## Pay Flow (UPI-Like)
1. User scans recipient QR.
2. User enters INR amount.
3. App requests INR->USDC quote from gateway.
4. User enters SolUPI PIN.
5. If session valid: execute delegated payment path.
6. If session invalid: require one-time MWA re-authorization, refresh session, then pay.
7. App shows tx status and explorer link.
