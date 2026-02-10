# Build Sequence

## 1. Initialize Mobile App (React Native)
Use bare React Native if you need direct native integration flexibility for Solana Mobile tooling.

```bash
npx @react-native-community/cli@latest init solupi-mobile --template react-native-template-typescript
```

Install core dependencies:
```bash
cd solupi-mobile
npm install @solana/web3.js @solana/pay react-native-qrcode-svg
npm install react-native-vision-camera react-native-safe-area-context @react-navigation/native
```

Add MWA packages based on current Solana Mobile docs and wire Android permissions.

## 2. Initialize Rust Gateway
```bash
cargo new solupi-gateway
cd solupi-gateway
```

Recommended crates:
1. `axum` (HTTP API)
2. `tokio` (async runtime)
3. `serde` + `serde_json` (serialization)
4. `sqlx` (Postgres)
5. `tracing` + `tracing-subscriber` (observability)
6. `uuid`, `chrono`, `anyhow`, `thiserror`
7. `argon2` for PIN hashing

## 3. DB and Infra
1. Start Postgres and Redis locally (docker compose).
2. Create migrations for users, handles, payment requests, splits.
3. Configure envs:
   - `SOLANA_RPC_URL`
   - `INDEXER_WEBHOOK_SECRET`
   - `DATABASE_URL`
   - `REDIS_URL`

## 4. Implement in This Order
1. `health` and `auth/nonce` endpoints
2. PIN enroll/verify
3. session create/get
4. handle register/resolve endpoints
5. quote endpoint
6. payment intent create/execute/get
7. split create/get
8. webhook processing

## 5. Integrate Mobile with Gateway
1. Connect wallet with MWA.
2. Enroll PIN and create delegated payment session.
3. Create payment intent via gateway.
4. Execute intent with `pinToken` + `sessionId`.
5. Confirm signature and status using gateway polling.

## 6. Test Gates Before Demo
1. E2E scan and pay on two devices.
2. Offline and retry behavior.
3. Wrong-handle and expired-quote behavior.
4. Split with 3 members, one late payer.
