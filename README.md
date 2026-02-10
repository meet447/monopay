# SolUPI

SolUPI is a mobile-native Solana payments app inspired by UPI flows:
- Scan and pay with QR
- Request money via shareable links
- Split bills with friends
- Handle-based payments (like VPA)
- PIN-first checkout flow

Primary settlement assets: `USDC` and `SOL` on Solana.

## Stack
- Mobile app: `React Native` (Android-first for Solana Mobile)
- Gateway (optional): `Rust` (`axum`) for aliases, quotes, notifications, and indexing
- On-chain: `Anchor` programs for split and settlement logic

## UX Principle
UPI-like payment in one flow:
1. scan QR
2. enter INR amount
3. enter SolUPI PIN
4. app converts INR to USDC and executes payment from selected wallet

To avoid repeated wallet confirmation popups, SolUPI uses delegated signing/session authorization with strict spend limits and expiry.

## Repository Layout
- `docs/architecture.md`: End-to-end system design
- `docs/mvp-scope.md`: MVP boundaries and acceptance criteria
- `docs/roadmap.md`: Build plan with phases
- `docs/api-contract.md`: Rust gateway API surface
- `docs/pin-session-model.md`: PIN + delegated-signing model
- `gateway/`: Rust API gateway scaffold
- `mobile/`: React Native app scaffold

## Build Strategy
1. Start with QR request/pay and basic P2P transfer.
2. Add handle resolution and multi-wallet linking.
3. Add split-bill flow (off-chain coordination + on-chain settlement).
4. Add optional NFC and notification polish.

See the docs folder for implementation details.
# monopay
