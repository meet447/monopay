# Rust Gateway API Contract (PIN + Session Draft)

Base path: `/v1`

## Auth
### `POST /auth/nonce`
Request:
```json
{
  "wallet": "9xQeWvG816bUx9EPf..."
}
```
Response:
```json
{
  "nonce": "f5b5bcb1-2e3f-4a4f-a587-08de...",
  "expiresAt": "2026-02-10T19:00:00Z"
}
```

### `POST /auth/verify`
Request:
```json
{
  "wallet": "9xQeWvG816bUx9EPf...",
  "signature": "base58sig...",
  "nonce": "f5b5bcb1-2e3f-4a4f-a587-08de..."
}
```
Response:
```json
{
  "accessToken": "jwt-or-paseto",
  "userId": "usr_123"
}
```

## PIN
### `POST /pin/enroll`
Request:
```json
{
  "pin": "1234"
}
```
Response:
```json
{
  "status": "enrolled"
}
```

### `POST /pin/verify`
Request:
```json
{
  "pin": "1234"
}
```
Response:
```json
{
  "verified": true,
  "pinToken": "pin_tok_abc",
  "expiresAt": "2026-02-10T19:20:00Z"
}
```

## Sessions
### `POST /sessions`
Purpose: create or refresh delegated payment session after wallet auth.

Request:
```json
{
  "wallet": "9xQeWvG816bUx9EPf...",
  "perTxLimitInr": 1000.00,
  "dailyLimitInr": 5000.00,
  "ttlMinutes": 1440,
  "deviceId": "android_device_hash"
}
```
Response:
```json
{
  "id": "sess_123",
  "status": "active",
  "expiresAt": "2026-02-11T19:00:00Z"
}
```

### `GET /sessions/current`
Response:
```json
{
  "id": "sess_123",
  "status": "active",
  "wallet": "9xQeWvG816bUx9EPf...",
  "perTxLimitInr": 1000.00,
  "dailyLimitInr": 5000.00,
  "remainingTodayInr": 4200.00,
  "expiresAt": "2026-02-11T19:00:00Z"
}
```

## Handles
### `POST /handles`
Request:
```json
{
  "handle": "priya",
  "wallet": "9xQeWvG816bUx9EPf..."
}
```
Response:
```json
{
  "handle": "@priya",
  "wallet": "9xQeWvG816bUx9EPf..."
}
```

### `GET /handles/{handle}`
Response:
```json
{
  "handle": "@priya",
  "wallet": "9xQeWvG816bUx9EPf..."
}
```

## Quotes
### `GET /quotes/usdc?inr=500`
Response:
```json
{
  "inr": "500.00",
  "usdc": "5.98",
  "rate": "83.61",
  "source": "oracle_aggregator",
  "asOf": "2026-02-10T19:00:00Z",
  "expiresAt": "2026-02-10T19:00:30Z"
}
```

## Payment Intents
### `POST /payment-intents`
Request:
```json
{
  "recipientHandle": "@priya",
  "inrAmount": 10.00,
  "token": "USDC",
  "memo": "Tea"
}
```
Response:
```json
{
  "id": "pi_123",
  "wallet": "9xQeWvG816bUx9EPf...",
  "recipientWallet": "7yDg...",
  "inrAmount": "10.00",
  "tokenAmount": "0.12",
  "token": "USDC",
  "quoteExpiresAt": "2026-02-10T19:00:30Z",
  "reference": "F9QqK..."
}
```

### `POST /payment-intents/{id}/execute`
Request:
```json
{
  "pinToken": "pin_tok_abc",
  "sessionId": "sess_123"
}
```
Response:
```json
{
  "id": "pi_123",
  "status": "submitted",
  "mode": "session_fast_path",
  "signature": "5fP9...",
  "explorerUrl": "https://solscan.io/tx/5fP9..."
}
```

### `GET /payment-intents/{id}`
Response:
```json
{
  "id": "pi_123",
  "status": "confirmed",
  "mode": "session_fast_path",
  "signature": "5fP9...",
  "explorerUrl": "https://solscan.io/tx/5fP9..."
}
```

## Splits
### `POST /splits`
Request:
```json
{
  "token": "USDC",
  "totalAmount": "30.00",
  "participants": ["@rohan", "@dev", "@priya"]
}
```
Response:
```json
{
  "id": "split_123",
  "perHeadAmount": "10.00",
  "status": "pending"
}
```

### `GET /splits/{id}`
Response:
```json
{
  "id": "split_123",
  "status": "pending",
  "members": [
    {"handle": "@rohan", "state": "paid"},
    {"handle": "@dev", "state": "pending"},
    {"handle": "@priya", "state": "pending"}
  ]
}
```

## Webhooks
### `POST /webhooks/solana/tx`
Purpose: internal endpoint for indexer callbacks to update payment/split state.

## Error Envelope
```json
{
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "Session expired, wallet re-authorization required",
    "requestId": "req_123"
  }
}
```
