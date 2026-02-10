# Roadmap

## Phase 0: Foundation (Day 1-2)
1. Create React Native app shell and navigation.
2. Set up Solana RPC config and env handling.
3. Scaffold Rust gateway with health endpoint.
4. Set up CI for lint/test/build.

Exit criteria:
1. Mobile app runs on Android emulator/device.
2. Gateway boots and serves `/health`.

## Phase 1: Core Pay Flow (Day 3-5)
1. MWA connect and account selection.
2. Generate Solana Pay URL from amount/token/memo/reference.
3. QR render + scanner flow.
4. Signature submission and confirmation polling.
5. PIN setup screen and local lock screen.

Exit criteria:
1. End-to-end scan/pay works between 2 wallets.
2. Tx explorer link appears after confirmation.
3. PIN gate is enforced before pay execution.

## Phase 2: Handle + Quote + Session Service (Day 6-8)
1. Register `@handle` mapped to pubkey.
2. Add INR input + quote API conversion to USDC display amount.
3. Add payment request object with short link/share action.
4. Add delegated payment session create/refresh endpoint.
5. Add PIN verify endpoint with lockout policy.

Exit criteria:
1. `@handle` payment request can be created and shared.
2. Quote timestamp and source are visible in UI.
3. PIN + active session can execute payment without extra wallet prompt.

## Phase 3: Split Bills (Day 9-11)
1. Create equal split with participants.
2. Track participant payment state.
3. Add Anchor split account settlement receipt.

Exit criteria:
1. Organizer can see paid/pending participants.
2. Final split closes when all members settle.

## Phase 4: Demo Polish (Day 12-13)
1. NFC tap-to-pay prototype (if device supports it).
2. SMS/WhatsApp notification hooks.
3. UI polish and error-state hardening.

Exit criteria:
1. Demo flow runs without manual intervention.
2. Clear fallback messages for failed transactions.

## Risk Register
1. MWA wallet compatibility differences.
2. Mainnet fee volatility and token account edge cases.
3. Quote source reliability.
4. Split logic complexity if unequal shares are added too early.
5. Session key security and abuse prevention.

## Mitigation
1. Keep MVP to equal splits first.
2. Build deterministic integration tests for payment flow.
3. Cache quotes with explicit expiry.
4. Support Devnet first, then Mainnet beta switch.
5. Enforce strict session limits (per-tx, daily, expiry, device binding).
