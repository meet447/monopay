# monopay Mobile Scaffold

This directory contains product-oriented TypeScript scaffolding for the React Native app.

## Implemented in scaffold
1. API type contracts aligned to the gateway docs
2. PIN-first pay controller flow
3. Basic `PayScreen` component skeleton
4. Payment state machine

## Intended runtime flow
1. Scan recipient QR
2. Enter INR amount
3. Verify PIN
4. Create payment intent
5. Execute payment using active session
6. Poll status and show explorer link

## Next integration steps
1. Initialize a full React Native app shell in this folder.
2. Wire MWA wallet link and session refresh fallback.
3. Replace placeholder QR scan input with camera scanner.
