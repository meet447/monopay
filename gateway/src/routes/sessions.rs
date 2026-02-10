use crate::error::AppError;
use crate::models::{CreateSessionRequest, SessionResponse};
use crate::state::{AppState, SessionRecord};
use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;
use chrono::{Duration, Utc};
use uuid::Uuid;

fn user_id_from_headers(headers: &HeaderMap) -> Result<String, AppError> {
    headers
        .get("x-user-id")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.to_string())
        .ok_or_else(|| AppError::unauthorized("x-user-id header is required"))
}

pub async fn create_or_refresh_session(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateSessionRequest>,
) -> Result<Json<SessionResponse>, AppError> {
    let user_id = user_id_from_headers(&headers)?;
    if payload.ttl_minutes <= 0 {
        return Err(AppError::bad_request("ttlMinutes must be positive"));
    }
    if payload.per_tx_limit_inr <= 0.0 || payload.daily_limit_inr <= 0.0 {
        return Err(AppError::bad_request("session limits must be positive"));
    }

    let expires_at = Utc::now() + Duration::minutes(payload.ttl_minutes);
    let id = format!("sess_{}", Uuid::new_v4().simple());

    let record = SessionRecord {
        id: id.clone(),
        wallet: payload.wallet.clone(),
        device_id: payload.device_id,
        per_tx_limit_inr: payload.per_tx_limit_inr,
        daily_limit_inr: payload.daily_limit_inr,
        used_today_inr: 0.0,
        expires_at,
        status: "active".to_string(),
    };

    let mut store = state.store.write().await;
    store.sessions.insert(user_id, record.clone());

    Ok(Json(SessionResponse {
        id: record.id,
        status: record.status,
        wallet: record.wallet,
        per_tx_limit_inr: record.per_tx_limit_inr,
        daily_limit_inr: record.daily_limit_inr,
        remaining_today_inr: record.daily_limit_inr - record.used_today_inr,
        expires_at: record.expires_at,
    }))
}

pub async fn get_current_session(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SessionResponse>, AppError> {
    let user_id = user_id_from_headers(&headers)?;

    let store = state.store.read().await;
    let record = store
        .sessions
        .get(&user_id)
        .ok_or_else(|| AppError::not_found("no active session found"))?;

    Ok(Json(SessionResponse {
        id: record.id.clone(),
        status: record.status.clone(),
        wallet: record.wallet.clone(),
        per_tx_limit_inr: record.per_tx_limit_inr,
        daily_limit_inr: record.daily_limit_inr,
        remaining_today_inr: record.daily_limit_inr - record.used_today_inr,
        expires_at: record.expires_at,
    }))
}
