# SolUPI Gateway Scaffold

Rust `axum` API scaffold for UPI-like crypto flow with PIN + session authorization.

## Run
```bash
cd /Users/meetsonawane/Code/project/solupi/gateway
cargo run
```

Optional env:
```bash
SOLUPI_HOST=0.0.0.0
SOLUPI_PORT=8080
```

## Demo API Sequence
1. Create nonce:
```bash
curl -s -X POST http://localhost:8080/v1/auth/nonce \
  -H "content-type: application/json" \
  -d '{"wallet":"9xQeWvG816bUx9EPf..."}'
```
2. Verify auth (signature is placeholder in scaffold):
```bash
curl -s -X POST http://localhost:8080/v1/auth/verify \
  -H "content-type: application/json" \
  -d '{"wallet":"9xQeWvG816bUx9EPf...","nonce":"<nonce>","signature":"demo_sig"}'
```
3. Enroll PIN:
```bash
curl -s -X POST http://localhost:8080/v1/pin/enroll \
  -H "content-type: application/json" \
  -H "x-user-id: <userId>" \
  -d '{"pin":"1234"}'
```
4. Create session:
```bash
curl -s -X POST http://localhost:8080/v1/sessions \
  -H "content-type: application/json" \
  -H "x-user-id: <userId>" \
  -d '{"wallet":"9xQeWvG816bUx9EPf...","deviceId":"android_device_hash","perTxLimitInr":1000,"dailyLimitInr":5000,"ttlMinutes":1440}'
```
