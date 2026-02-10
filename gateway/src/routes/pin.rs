use crate::error::AppError;
use crate::models::{EnrollPinRequest, EnrollPinResponse, VerifyPinRequest, VerifyPinResponse};
use crate::state::{AppState, PinProfileRecord};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;
use chrono::{Duration, Utc};
use rand_core::OsRng;
use uuid::Uuid;

const MAX_ATTEMPTS: u8 = 5;

fn user_id_from_headers(headers: &HeaderMap) -> Result<String, AppError> {
    headers
        .get("x-user-id")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.to_string())
        .ok_or_else(|| AppError::unauthorized("x-user-id header is required"))
}

pub async fn enroll_pin(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<EnrollPinRequest>,
) -> Result<Json<EnrollPinResponse>, AppError> {
    let user_id = user_id_from_headers(&headers)?;

    if payload.pin.len() < 4 || payload.pin.len() > 6 {
        return Err(AppError::bad_request("pin must be 4 to 6 digits"));
    }
    if !payload.pin.chars().all(|c| c.is_ascii_digit()) {
        return Err(AppError::bad_request("pin must contain only digits"));
    }

    let salt = SaltString::generate(&mut OsRng);
    let pin_hash = Argon2::default()
        .hash_password(payload.pin.as_bytes(), &salt)
        .map_err(|_| AppError::internal("failed to hash pin"))?
        .to_string();

    let mut store = state.store.write().await;
    store.pin_profiles.insert(
        user_id,
        PinProfileRecord {
            pin_hash,
            failed_attempts: 0,
            locked_until: None,
        },
    );

    Ok(Json(EnrollPinResponse {
        status: "enrolled".to_string(),
    }))
}

pub async fn verify_pin(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<VerifyPinRequest>,
) -> Result<Json<VerifyPinResponse>, AppError> {
    let user_id = user_id_from_headers(&headers)?;

    let mut store = state.store.write().await;
    let profile = store
        .pin_profiles
        .get_mut(&user_id)
        .ok_or_else(|| AppError::not_found("pin profile not found"))?;

    if let Some(until) = profile.locked_until {
        if Utc::now() < until {
            return Err(AppError::unauthorized("pin is temporarily locked"));
        }
        profile.locked_until = None;
    }

    let parsed_hash = PasswordHash::new(&profile.pin_hash)
        .map_err(|_| AppError::internal("invalid stored pin hash"))?;

    let verified = Argon2::default()
        .verify_password(payload.pin.as_bytes(), &parsed_hash)
        .is_ok();

    if !verified {
        profile.failed_attempts = profile.failed_attempts.saturating_add(1);
        if profile.failed_attempts >= MAX_ATTEMPTS {
            profile.failed_attempts = 0;
            profile.locked_until = Some(Utc::now() + Duration::minutes(15));
        }
        return Err(AppError::unauthorized("invalid pin"));
    }

    profile.failed_attempts = 0;

    let expires_at = Utc::now() + Duration::minutes(10);
    Ok(Json(VerifyPinResponse {
        verified: true,
        pin_token: format!("pin_tok_{}", Uuid::new_v4().simple()),
        expires_at,
    }))
}
