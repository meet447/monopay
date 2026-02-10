use crate::error::AppError;
use crate::models::{NonceRequest, NonceResponse, VerifyAuthRequest, VerifyAuthResponse};
use crate::state::{AppState, NonceRecord};
use axum::extract::State;
use axum::Json;
use chrono::{Duration, Utc};
use uuid::Uuid;

pub async fn create_nonce(
    State(state): State<AppState>,
    Json(payload): Json<NonceRequest>,
) -> Result<Json<NonceResponse>, AppError> {
    if payload.wallet.trim().is_empty() {
        return Err(AppError::bad_request("wallet is required"));
    }

    let nonce = Uuid::new_v4().to_string();
    let expires_at = Utc::now() + Duration::minutes(5);

    let mut store = state.store.write().await;
    store.wallet_nonces.insert(
        payload.wallet,
        NonceRecord {
            nonce: nonce.clone(),
            expires_at,
        },
    );

    Ok(Json(NonceResponse { nonce, expires_at }))
}

pub async fn verify_auth(
    State(state): State<AppState>,
    Json(payload): Json<VerifyAuthRequest>,
) -> Result<Json<VerifyAuthResponse>, AppError> {
    if payload.signature.trim().is_empty() {
        return Err(AppError::bad_request("signature is required"));
    }

    let mut store = state.store.write().await;
    let nonce_record = store
        .wallet_nonces
        .get(&payload.wallet)
        .ok_or_else(|| AppError::unauthorized("nonce not found"))?;

    if nonce_record.nonce != payload.nonce {
        return Err(AppError::unauthorized("nonce mismatch"));
    }
    if Utc::now() > nonce_record.expires_at {
        return Err(AppError::unauthorized("nonce expired"));
    }

    let user_id = store
        .wallet_users
        .entry(payload.wallet.clone())
        .or_insert_with(|| format!("usr_{}", Uuid::new_v4().simple()))
        .clone();
    let access_token = format!("acc_{}", Uuid::new_v4().simple());

    Ok(Json(VerifyAuthResponse {
        access_token,
        user_id,
    }))
}
