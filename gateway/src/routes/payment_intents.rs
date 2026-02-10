use crate::error::AppError;
use crate::models::{
    CreatePaymentIntentRequest, ExecutePaymentIntentRequest, ExecutePaymentIntentResponse,
    PaymentIntentResponse, PaymentIntentStatusResponse,
};
use crate::state::{AppState, PaymentIntentRecord};
use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::Json;
use chrono::{Duration, Utc};
use uuid::Uuid;

const INR_PER_USDC: f64 = 83.61;

fn user_id_from_headers(headers: &HeaderMap) -> Result<String, AppError> {
    headers
        .get("x-user-id")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.to_string())
        .ok_or_else(|| AppError::unauthorized("x-user-id header is required"))
}

pub async fn create_payment_intent(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreatePaymentIntentRequest>,
) -> Result<Json<PaymentIntentResponse>, AppError> {
    let user_id = user_id_from_headers(&headers)?;
    if payload.inr_amount <= 0.0 {
        return Err(AppError::bad_request("inrAmount must be positive"));
    }
    let normalized_token = payload.token.to_uppercase();
    if normalized_token != "USDC" && normalized_token != "SOL" {
        return Err(AppError::bad_request("token must be USDC or SOL"));
    }

    let mut store = state.store.write().await;
    let recipient_wallet = store
        .handles
        .get(&payload.recipient_handle.to_lowercase())
        .or_else(|| {
            store
                .handles
                .get(&format!("@{}", payload.recipient_handle.to_lowercase()))
        })
        .ok_or_else(|| AppError::not_found("recipient handle not found"))?
        .clone();

    let session = store
        .sessions
        .get(&user_id)
        .ok_or_else(|| AppError::unauthorized("active session required"))?;

    let id = format!("pi_{}", Uuid::new_v4().simple());
    let token_amount = payload.inr_amount / INR_PER_USDC;
    let quote_expires_at = Utc::now() + Duration::seconds(30);
    let reference = format!("ref_{}", Uuid::new_v4().simple());

    let record = PaymentIntentRecord {
        id: id.clone(),
        creator_user_id: user_id,
        recipient_wallet: recipient_wallet.clone(),
        inr_amount: payload.inr_amount,
        token_amount,
        token: normalized_token.clone(),
        quote_expires_at,
        status: "created".to_string(),
        mode: None,
        signature: None,
        reference: reference.clone(),
    };

    let wallet = session.wallet.clone();
    store.payment_intents.insert(id.clone(), record);

    Ok(Json(PaymentIntentResponse {
        id,
        wallet,
        recipient_wallet,
        inr_amount: format!("{:.2}", payload.inr_amount),
        token_amount: format!("{:.6}", token_amount),
        token: normalized_token,
        quote_expires_at,
        reference,
    }))
}

pub async fn execute_payment_intent(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(payload): Json<ExecutePaymentIntentRequest>,
) -> Result<Json<ExecutePaymentIntentResponse>, AppError> {
    let user_id = user_id_from_headers(&headers)?;
    if !payload.pin_token.starts_with("pin_tok_") {
        return Err(AppError::unauthorized("invalid pin token"));
    }

    let mut store = state.store.write().await;
    
    // Scoped block to handle session checks and get limits
    let (per_tx_limit, daily_limit, used_today) = {
        let session = store
            .sessions
            .get_mut(&user_id)
            .ok_or_else(|| AppError::unauthorized("active session required"))?;

        if session.id != payload.session_id {
            return Err(AppError::unauthorized("session mismatch"));
        }
        if Utc::now() > session.expires_at {
            session.status = "expired".to_string();
            return Err(AppError::unauthorized(
                "session expired, wallet re-authorization required",
            ));
        }
        (session.per_tx_limit_inr, session.daily_limit_inr, session.used_today_inr)
    };

    let intent = store
        .payment_intents
        .get_mut(&id)
        .ok_or_else(|| AppError::not_found("payment intent not found"))?;

    if intent.creator_user_id != user_id {
        return Err(AppError::unauthorized(
            "payment intent does not belong to user",
        ));
    }
    if Utc::now() > intent.quote_expires_at {
        return Err(AppError::bad_request(
            "quote expired, create new payment intent",
        ));
    }
    if intent.inr_amount > per_tx_limit {
        return Err(AppError::unauthorized(
            "session per transaction limit exceeded",
        ));
    }
    if used_today + intent.inr_amount > daily_limit {
        return Err(AppError::unauthorized("session daily limit exceeded"));
    }

    // Now update session and intent
    let inr_amount = intent.inr_amount;
    let signature = format!("sig_{}", Uuid::new_v4().simple());
    intent.status = "submitted".to_string();
    intent.mode = Some("session_fast_path".to_string());
    intent.signature = Some(signature.clone());

    let intent_id = intent.id.clone();
    let intent_status = intent.status.clone();
    let intent_mode = intent.mode.clone().unwrap_or_else(|| "unknown".to_string());

    if let Some(session) = store.sessions.get_mut(&user_id) {
        session.used_today_inr += inr_amount;
    }

    Ok(Json(ExecutePaymentIntentResponse {
        id: intent_id,
        status: intent_status,
        mode: intent_mode,
        signature: signature.clone(),
        explorer_url: format!("https://solscan.io/tx/{signature}"),
    }))
}

pub async fn get_payment_intent(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<PaymentIntentStatusResponse>, AppError> {
    let user_id = user_id_from_headers(&headers)?;

    let store = state.store.read().await;
    let intent = store
        .payment_intents
        .get(&id)
        .ok_or_else(|| AppError::not_found("payment intent not found"))?;

    if intent.creator_user_id != user_id {
        return Err(AppError::unauthorized(
            "payment intent does not belong to user",
        ));
    }

    let signature = intent.signature.clone();
    let explorer_url = signature
        .as_ref()
        .map(|sig| format!("https://solscan.io/tx/{sig}"));

    Ok(Json(PaymentIntentStatusResponse {
        id: intent.id.clone(),
        status: intent.status.clone(),
        mode: intent
            .mode
            .clone()
            .unwrap_or_else(|| "wallet_fallback_path".to_string()),
        signature,
        explorer_url,
    }))
}
